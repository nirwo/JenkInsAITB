import { router, protectedProcedure } from '../../context';
import { z } from 'zod';

export const analyticsRouter = router({
  getOverview: protectedProcedure
    .input(
      z.object({
        timeRange: z.enum(['24h', '7d', '30d', '90d']).default('7d'),
      })
    )
    .query(async ({ ctx, input }) => {
      const now = new Date();
      const timeRanges = {
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
        '90d': 90 * 24 * 60 * 60 * 1000,
      };
      const startTime = new Date(now.getTime() - timeRanges[input.timeRange]);

      const builds = await ctx.prisma.build.findMany({
        where: {
          timestamp: { gte: startTime },
        },
        select: {
          status: true,
          duration: true,
          timestamp: true,
        },
      });

      const totalBuilds = builds.length;
      const successfulBuilds = builds.filter(b => b.status === 'SUCCESS').length;
      const failedBuilds = builds.filter(b => b.status === 'FAILURE').length;
      const avgDuration = builds.reduce((acc, b) => acc + (b.duration || 0), 0) / totalBuilds || 0;

      return {
        totalBuilds,
        successfulBuilds,
        failedBuilds,
        avgDuration,
        successRate: totalBuilds > 0 ? (successfulBuilds / totalBuilds) * 100 : 0,
        builds: builds.slice(0, 100),
      };
    }),

  getJobPerformance: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const jobs = await ctx.prisma.job.findMany({
        take: input.limit,
        include: {
          builds: {
            take: 20,
            orderBy: { buildNumber: 'desc' },
          },
        },
        orderBy: { lastBuildTime: 'desc' },
      });

      return jobs.map(job => {
        const builds = job.builds;
        const totalBuilds = builds.length;
        const successful = builds.filter(b => b.status === 'SUCCESS').length;
        const avgDuration = builds.reduce((acc, b) => acc + (b.duration || 0), 0) / totalBuilds || 0;

        return {
          jobId: job.id,
          jobName: job.name,
          totalBuilds,
          successRate: totalBuilds > 0 ? (successful / totalBuilds) * 100 : 0,
          avgDuration,
          lastBuildTime: job.lastBuildTime,
        };
      });
    }),
});
