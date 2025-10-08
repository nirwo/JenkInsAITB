import { router, protectedProcedure, adminProcedure } from '../../context';
import { z } from 'zod';
import { JenkinsLoadBalancer } from '../../infrastructure/loadbalancer/jenkins-loadbalancer';
import { jenkinsClientFactory } from './jenkins.client';
import { TRPCError } from '@trpc/server';
import { prisma } from '../../infrastructure/database/prisma';
import { jenkinsSyncService } from '../../index';

const loadBalancer = new JenkinsLoadBalancer(prisma);

export const jenkinsRouter = router({
  // Get all Jenkins instances
  getInstances: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.jenkinsInstance.findMany({
      orderBy: [{ clusterId: 'asc' }, { priority: 'desc' }],
    });
  }),

  // Get Jenkins instance by ID
  getInstance: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const instance = await ctx.prisma.jenkinsInstance.findUnique({
        where: { id: input.id },
        include: {
          jobs: { take: 10, orderBy: { updatedAt: 'desc' } },
          executors: { take: 5 },
        },
      });

      if (!instance) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Jenkins instance not found',
        });
      }

      return instance;
    }),

  // Create new Jenkins instance
  createInstance: adminProcedure
    .input(
      z.object({
        name: z.string(),
        url: z.string().url(),
        username: z.string(),
        apiToken: z.string(),
        description: z.string().optional(),
        isPrimary: z.boolean().default(false),
        clusterId: z.string().optional(),
        loadBalancerUrl: z.string().url().optional(),
        priority: z.number().int().min(0).default(0),
        healthCheckUrl: z.string().url().optional(),
        maxConnections: z.number().int().min(1).default(100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Test connection before saving
      const testInstance = { ...input, id: 'test', currentLoad: 0, healthStatus: 'unknown' } as any;
      const client = jenkinsClientFactory.getClient(testInstance);
      
      try {
        const isHealthy = await client.healthCheck();
        if (!isHealthy) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Cannot connect to Jenkins instance',
          });
        }
      } catch (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Failed to connect to Jenkins: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }

      return ctx.prisma.jenkinsInstance.create({
        data: {
          ...input,
          lastSyncAt: new Date(),
        },
      });
    }),

  // Update Jenkins instance
  updateInstance: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        url: z.string().url().optional(),
        username: z.string().optional(),
        apiToken: z.string().optional(),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
        isPrimary: z.boolean().optional(),
        clusterId: z.string().optional(),
        loadBalancerUrl: z.string().url().optional(),
        priority: z.number().int().min(0).optional(),
        healthCheckUrl: z.string().url().optional(),
        maxConnections: z.number().int().min(1).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      return ctx.prisma.jenkinsInstance.update({
        where: { id },
        data,
      });
    }),

  // Delete Jenkins instance
  deleteInstance: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Remove from cache
      jenkinsClientFactory.removeClient(input.id);

      return ctx.prisma.jenkinsInstance.delete({
        where: { id: input.id },
      });
    }),

  // Get optimal instance for cluster
  getOptimalInstance: protectedProcedure
    .input(z.object({ clusterId: z.string().optional() }))
    .query(async ({ input }) => {
      const instance = await loadBalancer.getOptimalInstance(input.clusterId);
      
      if (!instance) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No healthy Jenkins instances available',
        });
      }

      return instance;
    }),

  // Get all clusters
  getClusters: protectedProcedure.query(async () => {
    const clusters = await loadBalancer.getAllClusters();
    
    return Array.from(clusters.entries()).map(([clusterId, instances]) => ({
      clusterId,
      instances: instances.map(inst => ({
        id: inst.id,
        name: inst.name,
        url: inst.url,
        isPrimary: inst.isPrimary,
        priority: inst.priority,
        currentLoad: inst.currentLoad,
        maxConnections: inst.maxConnections,
        healthStatus: inst.healthStatus,
        lastHealthCheck: inst.lastHealthCheck,
      })),
      totalInstances: instances.length,
      healthyInstances: instances.filter(i => i.healthStatus === 'healthy').length,
      totalLoad: instances.reduce((sum, i) => sum + i.currentLoad, 0),
      totalCapacity: instances.reduce((sum, i) => sum + i.maxConnections, 0),
    }));
  }),

  // Perform health check on all instances
  performHealthChecks: adminProcedure.mutation(async () => {
    await loadBalancer.performHealthChecks();
    return { success: true, message: 'Health checks completed' };
  }),

  // Test connection to instance
  testConnection: adminProcedure
    .input(
      z.object({
        url: z.string().url(),
        username: z.string(),
        apiToken: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const testInstance = {
        id: 'test',
        ...input,
        name: 'test',
        isActive: true,
        loadBalancerUrl: null,
        currentLoad: 0,
        healthStatus: 'unknown',
      } as any;

      const client = jenkinsClientFactory.getClient(testInstance);

      try {
        const systemInfo = await client.getSystemInfo();
        return {
          success: true,
          version: systemInfo.version || 'Unknown',
          message: 'Connection successful',
        };
      } catch (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }),

  // Get instance statistics
  getInstanceStats: protectedProcedure
    .input(z.object({ instanceId: z.string() }))
    .query(async ({ ctx, input }) => {
      const instance = await ctx.prisma.jenkinsInstance.findUnique({
        where: { id: input.instanceId },
        include: {
          jobs: { select: { id: true, status: true } },
          executors: { select: { id: true, isIdle: true } },
        },
      });

      if (!instance) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Jenkins instance not found',
        });
      }

      const totalJobs = instance.jobs.length;
      const activeJobs = instance.jobs.filter((j: any) => j.status === 'RUNNING').length;
      const totalExecutors = instance.executors.length;
      const idleExecutors = instance.executors.filter((e: any) => e.isIdle).length;

      return {
        instanceId: instance.id,
        name: instance.name,
        currentLoad: instance.currentLoad,
        maxConnections: instance.maxConnections,
        utilizationPercent: (instance.currentLoad / instance.maxConnections) * 100,
        healthStatus: instance.healthStatus,
        lastHealthCheck: instance.lastHealthCheck,
        totalJobs,
        activeJobs,
        totalExecutors,
        idleExecutors,
        busyExecutors: totalExecutors - idleExecutors,
        executorUtilization: totalExecutors > 0 ? ((totalExecutors - idleExecutors) / totalExecutors) * 100 : 0,
      };
    }),

  // Manually trigger sync
  syncJobs: protectedProcedure.mutation(async () => {
    await jenkinsSyncService.triggerSync();
    return { success: true, message: 'Sync triggered successfully' };
  }),

  // Get sync status
  getSyncStatus: protectedProcedure.query(() => {
    return jenkinsSyncService.getStatus();
  }),
});
