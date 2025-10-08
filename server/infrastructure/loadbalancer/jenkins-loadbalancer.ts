import { PrismaClient, JenkinsInstance } from '@prisma/client';
import { logger } from '../../common/utils/logger';
import { redis } from '../../index';

/**
 * Jenkins Load Balancer
 * Manages multiple Jenkins master instances with intelligent load balancing
 */
export class JenkinsLoadBalancer {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get the best available Jenkins instance based on load and health
   */
  async getOptimalInstance(clusterId?: string): Promise<JenkinsInstance | null> {
    const instances = await this.getHealthyInstances(clusterId);
    
    if (instances.length === 0) {
      logger.warn('No healthy Jenkins instances available');
      return null;
    }

    // Sort by load (ascending) and priority (descending)
    const sorted = instances.sort((a, b) => {
      const loadDiff = a.currentLoad - b.currentLoad;
      if (loadDiff !== 0) return loadDiff;
      return b.priority - a.priority;
    });

    return sorted[0];
  }

  /**
   * Get all healthy Jenkins instances
   */
  async getHealthyInstances(clusterId?: string): Promise<JenkinsInstance[]> {
    const where: any = {
      isActive: true,
      healthStatus: 'healthy',
    };

    if (clusterId) {
      where.clusterId = clusterId;
    }

    return this.prisma.jenkinsInstance.findMany({
      where,
      orderBy: [
        { currentLoad: 'asc' },
        { priority: 'desc' },
      ],
    });
  }

  /**
   * Increment load for an instance
   */
  async incrementLoad(instanceId: string): Promise<void> {
    await this.prisma.jenkinsInstance.update({
      where: { id: instanceId },
      data: {
        currentLoad: {
          increment: 1,
        },
      },
    });

    // Update cache
    await this.updateInstanceCache(instanceId);
  }

  /**
   * Decrement load for an instance
   */
  async decrementLoad(instanceId: string): Promise<void> {
    await this.prisma.jenkinsInstance.update({
      where: { id: instanceId },
      data: {
        currentLoad: {
          decrement: 1,
        },
      },
    });

    // Update cache
    await this.updateInstanceCache(instanceId);
  }

  /**
   * Health check for all instances
   */
  async performHealthChecks(): Promise<void> {
    const instances = await this.prisma.jenkinsInstance.findMany({
      where: { isActive: true },
    });

    await Promise.all(
      instances.map(instance => this.checkInstanceHealth(instance))
    );
  }

  /**
   * Check health of a single instance
   */
  private async checkInstanceHealth(instance: JenkinsInstance): Promise<void> {
    try {
      const healthUrl = instance.healthCheckUrl || `${instance.url}/api/json`;
      const auth = Buffer.from(`${instance.username}:${instance.apiToken}`).toString('base64');

      const response = await fetch(healthUrl, {
        headers: {
          Authorization: `Basic ${auth}`,
        },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      const isHealthy = response.ok;
      const newStatus = isHealthy ? 'healthy' : 'degraded';

      await this.prisma.jenkinsInstance.update({
        where: { id: instance.id },
        data: {
          healthStatus: newStatus,
          lastHealthCheck: new Date(),
        },
      });

      logger.info(`Health check for ${instance.name}: ${newStatus}`);
    } catch (error) {
      logger.error(`Health check failed for ${instance.name}:`, error);
      
      await this.prisma.jenkinsInstance.update({
        where: { id: instance.id },
        data: {
          healthStatus: 'unhealthy',
          lastHealthCheck: new Date(),
        },
      });
    }
  }

  /**
   * Update instance cache in Redis
   */
  private async updateInstanceCache(instanceId: string): Promise<void> {
    const instance = await this.prisma.jenkinsInstance.findUnique({
      where: { id: instanceId },
    });

    if (instance) {
      await redis.set(
        `jenkins:instance:${instanceId}`,
        JSON.stringify(instance),
        'EX',
        300 // 5 minutes cache
      );
    }
  }

  /**
   * Get instance from cache or database
   */
  async getInstance(instanceId: string): Promise<JenkinsInstance | null> {
    // Try cache first
    const cached = await redis.get(`jenkins:instance:${instanceId}`);
    if (cached) {
      return JSON.parse(cached);
    }

    // Fallback to database
    const instance = await this.prisma.jenkinsInstance.findUnique({
      where: { id: instanceId },
    });

    if (instance) {
      await this.updateInstanceCache(instanceId);
    }

    return instance;
  }

  /**
   * Get primary master in cluster
   */
  async getPrimaryMaster(clusterId: string): Promise<JenkinsInstance | null> {
    return this.prisma.jenkinsInstance.findFirst({
      where: {
        clusterId,
        isPrimary: true,
        isActive: true,
        healthStatus: 'healthy',
      },
    });
  }

  /**
   * Failover to backup master
   */
  async failoverToPrimary(clusterId: string, currentMasterId: string): Promise<JenkinsInstance | null> {
    // Mark current master as unhealthy
    await this.prisma.jenkinsInstance.update({
      where: { id: currentMasterId },
      data: { healthStatus: 'unhealthy' },
    });

    // Get next available master
    const backup = await this.prisma.jenkinsInstance.findFirst({
      where: {
        clusterId,
        isActive: true,
        healthStatus: 'healthy',
        id: { not: currentMasterId },
      },
      orderBy: { priority: 'desc' },
    });

    if (backup) {
      logger.info(`Failover: Switching from ${currentMasterId} to ${backup.id}`);
    }

    return backup;
  }

  /**
   * Round-robin load balancing
   */
  async getRoundRobinInstance(clusterId?: string): Promise<JenkinsInstance | null> {
    const instances = await this.getHealthyInstances(clusterId);
    
    if (instances.length === 0) return null;

    // Get last used index from cache
    const cacheKey = `jenkins:loadbalancer:${clusterId || 'default'}:index`;
    const lastIndex = await redis.get(cacheKey);
    const currentIndex = lastIndex ? (parseInt(lastIndex) + 1) % instances.length : 0;

    // Update cache
    await redis.set(cacheKey, currentIndex.toString(), 'EX', 3600);

    return instances[currentIndex];
  }

  /**
   * Weighted load balancing based on priority
   */
  async getWeightedInstance(clusterId?: string): Promise<JenkinsInstance | null> {
    const instances = await this.getHealthyInstances(clusterId);
    
    if (instances.length === 0) return null;

    // Calculate total weight
    const totalWeight = instances.reduce((sum, inst) => sum + inst.priority, 0);
    
    if (totalWeight === 0) {
      // Fallback to round-robin if no priorities set
      return this.getRoundRobinInstance(clusterId);
    }

    // Random weighted selection
    const random = Math.random() * totalWeight;
    let sum = 0;

    for (const instance of instances) {
      sum += instance.priority;
      if (random <= sum) {
        return instance;
      }
    }

    return instances[0];
  }

  /**
   * Get all clusters with their instances
   */
  async getAllClusters(): Promise<Map<string, JenkinsInstance[]>> {
    const instances = await this.prisma.jenkinsInstance.findMany({
      where: { isActive: true },
      orderBy: [
        { clusterId: 'asc' },
        { priority: 'desc' },
      ],
    });

    const clusters = new Map<string, JenkinsInstance[]>();
    
    for (const instance of instances) {
      const clusterId = instance.clusterId || 'default';
      if (!clusters.has(clusterId)) {
        clusters.set(clusterId, []);
      }
      clusters.get(clusterId)!.push(instance);
    }

    return clusters;
  }
}
