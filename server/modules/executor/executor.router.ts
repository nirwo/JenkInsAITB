import { router, protectedProcedure } from '../../context';
import { z } from 'zod';

export const executorRouter = router({
  getAll: protectedProcedure
    .input(
      z.object({
        idle: z.boolean().optional(),
        offline: z.boolean().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {};
      if (input.idle !== undefined) where.idle = input.idle;
      if (input.offline !== undefined) where.offline = input.offline;

      const executors = await ctx.prisma.executor.findMany({
        where,
        include: {
          jenkinsInstance: {
            select: { id: true, name: true, url: true },
          },
        },
        orderBy: { number: 'asc' },
      });

      return executors;
    }),

  getStats: protectedProcedure
    .input(
      z.object({
        timeRange: z.enum(['1h', '24h', '7d', '30d']).default('24h'),
        executorId: z.string().uuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const now = new Date();
      const timeRanges = {
        '1h': 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
      };
      const startTime = new Date(now.getTime() - timeRanges[input.timeRange]);

      const where: Record<string, unknown> = {
        startedAt: { gte: startTime },
      };
      if (input.executorId) {
        where.executorId = input.executorId;
      }

      const history = await ctx.prisma.executorHistory.findMany({
        where,
        orderBy: { startedAt: 'desc' },
      });

      // Calculate statistics
      const totalBuilds = history.length;
      const successfulBuilds = history.filter(h => h.status === 'SUCCESS').length;
      const failedBuilds = history.filter(h => h.status === 'FAILURE').length;
      const avgDuration = history.reduce((acc, h) => acc + (h.duration || 0), 0) / totalBuilds || 0;

      return {
        totalBuilds,
        successfulBuilds,
        failedBuilds,
        avgDuration,
        successRate: totalBuilds > 0 ? (successfulBuilds / totalBuilds) * 100 : 0,
        history: history.slice(0, 100), // Return last 100 records
      };
    }),
});
