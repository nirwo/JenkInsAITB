import { router, protectedProcedure } from '../../context';
import { z } from 'zod';
import { analyzeLogWithAI } from '../ai/ai.service';

export const logRouter = router({
  analyze: protectedProcedure
    .input(
      z.object({
        buildId: z.string().uuid(),
        forceRefresh: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if analysis already exists
      if (!input.forceRefresh) {
        const existing = await ctx.prisma.logAnalysis.findUnique({
          where: { buildId: input.buildId },
        });
        if (existing) {
          return existing;
        }
      }

      // Get build details with Jenkins instance
      const build = await ctx.prisma.build.findUnique({
        where: { id: input.buildId },
        include: { 
          job: {
            include: {
              jenkinsInstance: true,
            },
          },
        },
      });

      if (!build) {
        throw new Error('Build not found');
      }

      // Prepare Jenkins authentication
      const jenkinsAuth = {
        username: build.job.jenkinsInstance.username,
        apiToken: build.job.jenkinsInstance.apiToken,
      };

      // Fetch and analyze logs
      const startTime = Date.now();
      const analysis = await analyzeLogWithAI(build.url, jenkinsAuth);
      const processingTime = Date.now() - startTime;

      // Store analysis
      const result = await ctx.prisma.logAnalysis.upsert({
        where: { buildId: input.buildId },
        create: {
          buildId: input.buildId,
          summary: analysis.summary,
          rootCause: analysis.rootCause,
          errorCategory: analysis.errorCategory,
          stackTrace: analysis.stackTrace ?? null,
          failedTests: (analysis.failedTests || []) as any,
          recommendations: (analysis.recommendations || []) as any,
          sentiment: analysis.sentiment,
          processingTime,
        },
        update: {
          summary: analysis.summary,
          rootCause: analysis.rootCause,
          errorCategory: analysis.errorCategory,
          stackTrace: analysis.stackTrace ?? null,
          failedTests: (analysis.failedTests || []) as any,
          recommendations: (analysis.recommendations || []) as any,
          sentiment: analysis.sentiment,
          processingTime,
        },
      });

      // Update build
      await ctx.prisma.build.update({
        where: { id: input.buildId },
        data: { hasLogAnalysis: true },
      });

      return result;
    }),

  getAnalysis: protectedProcedure
    .input(z.object({ buildId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const analysis = await ctx.prisma.logAnalysis.findUnique({
        where: { buildId: input.buildId },
        include: {
          build: {
            include: { job: true },
          },
        },
      });

      return analysis;
    }),

  getRawLogs: protectedProcedure
    .input(z.object({ buildId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Get build details with Jenkins instance
      const build = await ctx.prisma.build.findUnique({
        where: { id: input.buildId },
        include: { 
          job: {
            include: {
              jenkinsInstance: true,
            },
          },
        },
      });

      if (!build) {
        throw new Error('Build not found');
      }

      // Construct console output URL - remove trailing slash if present
      const baseUrl = build.url.endsWith('/') 
        ? build.url.slice(0, -1) 
        : build.url;
      const consoleUrl = `${baseUrl}/consoleText`;

      // Fetch logs with authentication
      const axios = (await import('axios')).default;
      const auth = Buffer.from(
        `${build.job.jenkinsInstance.username}:${build.job.jenkinsInstance.apiToken}`
      ).toString('base64');

      try {
        const response = await axios.get(consoleUrl, {
          headers: {
            'Authorization': `Basic ${auth}`,
          },
          responseType: 'text',
        });

        return {
          logs: response.data as string,
          build: {
            id: build.id,
            buildNumber: build.buildNumber,
            status: build.status,
            url: build.url,
            timestamp: build.timestamp,
            job: {
              id: build.job.id,
              name: build.job.name,
              displayName: build.job.displayName,
            },
          },
        };
      } catch (error) {
        if (axios.isAxiosError(error)) {
          throw new Error(`Failed to fetch logs: ${error.response?.statusText || error.message}`);
        }
        throw error;
      }
    }),
});
