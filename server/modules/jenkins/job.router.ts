import { router, protectedProcedure } from '../../context';
import { z } from 'zod';

export const jobRouter = router({
  getAll: protectedProcedure
    .input(
      z.object({
        status: z.enum(['SUCCESS', 'FAILURE', 'RUNNING', 'UNSTABLE', 'ABORTED', 'NOT_BUILT']).optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        sortBy: z.enum(['name', 'lastBuildTime', 'status']).default('lastBuildTime'),
        sortOrder: z.enum(['asc', 'desc']).default('desc'),
      })
    )
    .query(async ({ ctx, input }) => {
      const where = input.status ? { lastBuildStatus: input.status } : {};

      const [jobs, total] = await Promise.all([
        ctx.prisma.job.findMany({
          where,
          take: input.limit,
          skip: input.offset,
          orderBy: { [input.sortBy]: input.sortOrder },
          include: {
            jenkinsInstance: {
              select: { id: true, name: true, url: true },
            },
            builds: {
              take: 1,
              orderBy: { buildNumber: 'desc' },
            },
          },
        }),
        ctx.prisma.job.count({ where }),
      ]);

      return { jobs, total, limit: input.limit, offset: input.offset };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const job = await ctx.prisma.job.findUnique({
        where: { id: input.id },
        include: {
          jenkinsInstance: true,
          builds: {
            take: 10,
            orderBy: { buildNumber: 'desc' },
          },
          labels: {
            include: { label: true },
          },
        },
      });

      return job;
    }),

  getBuilds: protectedProcedure
    .input(
      z.object({
        jobId: z.string().uuid(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const [builds, total] = await Promise.all([
        ctx.prisma.build.findMany({
          where: { jobId: input.jobId },
          take: input.limit,
          skip: input.offset,
          orderBy: { buildNumber: 'desc' },
        }),
        ctx.prisma.build.count({ where: { jobId: input.jobId } }),
      ]);

      return { builds, total };
    }),
});
