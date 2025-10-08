import { PrismaClient } from '@prisma/client';
import { jenkinsClientFactory } from './jenkins.client';
import { logger } from '../../common/utils/logger';

/**
 * Jenkins Sync Service
 * Automatically syncs jobs and builds from Jenkins instances to database
 */
export class JenkinsSyncService {
  private syncInterval: NodeJS.Timeout | null = null;
  private isSyncing = false;

  constructor(
    private prisma: PrismaClient,
    private intervalMs: number = 30000 // Default: 30 seconds
  ) {}

  /**
   * Start automatic syncing
   */
  start(): void {
    if (this.syncInterval) {
      logger.warn('Sync service already running');
      return;
    }

    logger.info(`Starting Jenkins sync service (interval: ${this.intervalMs}ms)`);
    
    // Initial sync
    this.syncAll().catch((error) => {
      logger.error('Initial sync failed:', error);
    });

    // Periodic sync
    this.syncInterval = setInterval(() => {
      this.syncAll().catch((error) => {
        logger.error('Periodic sync failed:', error);
      });
    }, this.intervalMs);
  }

  /**
   * Stop automatic syncing
   */
  stop(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      logger.info('Jenkins sync service stopped');
    }
  }

  /**
   * Sync all active Jenkins instances
   */
  async syncAll(): Promise<void> {
    if (this.isSyncing) {
      logger.debug('Sync already in progress, skipping...');
      return;
    }

    this.isSyncing = true;
    const startTime = Date.now();

    try {
      const instances = await this.prisma.jenkinsInstance.findMany({
        where: { isActive: true },
      });

      if (instances.length === 0) {
        logger.warn('No active Jenkins instances found');
        return;
      }

      logger.info(`Syncing ${instances.length} Jenkins instance(s)...`);

      for (const instance of instances) {
        try {
          await this.syncInstance(instance.id);
        } catch (error) {
          logger.error(`Failed to sync instance ${instance.name}:`, error);
        }
      }

      const duration = Date.now() - startTime;
      logger.info(`Sync completed in ${duration}ms`);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sync a specific Jenkins instance
   */
  async syncInstance(instanceId: string): Promise<void> {
    const instance = await this.prisma.jenkinsInstance.findUnique({
      where: { id: instanceId },
    });

    if (!instance) {
      throw new Error(`Jenkins instance ${instanceId} not found`);
    }

    logger.debug(`Syncing instance: ${instance.name}`);

    const client = jenkinsClientFactory.getClient(instance);

    // Fetch jobs from Jenkins
    const jenkinsJobs = await client.getJobs();
    logger.debug(`Found ${jenkinsJobs.length} jobs on ${instance.name}`);

    for (const jenkinsJob of jenkinsJobs) {
      try {
        await this.syncJob(instance.id, jenkinsJob);
      } catch (error) {
        logger.error(`Failed to sync job ${jenkinsJob.name}:`, error);
      }
    }

    // Update last sync time
    await this.prisma.jenkinsInstance.update({
      where: { id: instanceId },
      data: { lastSyncAt: new Date() },
    });
  }

  /**
   * Sync a single job
   */
  private async syncJob(instanceId: string, jenkinsJob: any): Promise<void> {
    const instance = await this.prisma.jenkinsInstance.findUnique({
      where: { id: instanceId },
    });

    if (!instance) return;

    // Determine job status from color
    const color = jenkinsJob.color || 'notbuilt';
    let lastBuildStatus: string = 'NOT_BUILT';
    
    if (color.includes('blue')) lastBuildStatus = 'SUCCESS';
    else if (color.includes('red')) lastBuildStatus = 'FAILURE';
    else if (color.includes('yellow')) lastBuildStatus = 'UNSTABLE';
    else if (color.includes('aborted')) lastBuildStatus = 'ABORTED';
    else if (color.includes('anime')) lastBuildStatus = 'RUNNING';

    const client = jenkinsClientFactory.getClient(instance);
    let jobDetails;
    
    try {
      jobDetails = await client.getJob(jenkinsJob.name);
    } catch (error) {
      logger.error(`Failed to get job details for ${jenkinsJob.name}:`, error);
      return;
    }

    // Map Jenkins class name to JobType enum
    const jenkinsClass = jobDetails._class || '';
    let jobType: 'FREESTYLE' | 'PIPELINE' | 'MULTIBRANCH' | 'FOLDER' | 'MAVEN' = 'FREESTYLE';
    
    if (jenkinsClass.includes('WorkflowJob')) jobType = 'PIPELINE';
    else if (jenkinsClass.includes('WorkflowMultiBranchProject')) jobType = 'MULTIBRANCH';
    else if (jenkinsClass.includes('Folder')) jobType = 'FOLDER';
    else if (jenkinsClass.includes('MavenModuleSet')) jobType = 'MAVEN';
    else jobType = 'FREESTYLE'; // Default

    // Upsert job
    const job = await this.prisma.job.upsert({
      where: {
        jenkinsInstanceId_name: {
          jenkinsInstanceId: instanceId,
          name: jenkinsJob.name,
        },
      },
      create: {
        jenkinsInstanceId: instanceId,
        name: jenkinsJob.name,
        displayName: jobDetails.displayName || jenkinsJob.name,
        url: jenkinsJob.url,
        type: jobType,
        color: color,
        description: jobDetails.description || '',
        buildable: jobDetails.buildable ?? true,
        inQueue: jobDetails.inQueue ?? false,
        lastBuildNumber: jenkinsJob.lastBuild?.number || 0,
        lastBuildStatus: lastBuildStatus,
        lastBuildTime: jenkinsJob.lastBuild?.timestamp 
          ? new Date(jenkinsJob.lastBuild.timestamp) 
          : new Date(),
        healthScore: jobDetails.healthReport?.[0]?.score || 100,
      },
      update: {
        displayName: jobDetails.displayName || jenkinsJob.name,
        url: jenkinsJob.url,
        type: jobType,
        color: color,
        description: jobDetails.description || '',
        buildable: jobDetails.buildable ?? true,
        inQueue: jobDetails.inQueue ?? false,
        lastBuildNumber: jenkinsJob.lastBuild?.number || 0,
        lastBuildStatus: lastBuildStatus,
        lastBuildTime: jenkinsJob.lastBuild?.timestamp 
          ? new Date(jenkinsJob.lastBuild.timestamp) 
          : new Date(),
        healthScore: jobDetails.healthReport?.[0]?.score || 100,
        updatedAt: new Date(),
      },
    });

    // Sync recent builds (last 5)
    if (jenkinsJob.lastBuild) {
      await this.syncBuilds(job.id, jenkinsJob.name, instance);
    }
  }

  /**
   * Sync builds for a job
   */
  private async syncBuilds(jobId: string, jobName: string, instance: any): Promise<void> {
    const client = jenkinsClientFactory.getClient(instance);
    
    try {
      const builds = await client.getBuilds(jobName, 5);
      
      for (const build of builds) {
        try {
          const buildStatus = this.mapBuildResult(build.result);
          
          await this.prisma.build.upsert({
            where: {
              jobId_buildNumber: {
                jobId: jobId,
                buildNumber: build.number,
              },
            },
            create: {
              jobId: jobId,
              buildNumber: build.number,
              status: buildStatus,
              url: build.url,
              duration: build.duration || 0,
              timestamp: build.timestamp ? new Date(build.timestamp) : new Date(),
            },
            update: {
              status: buildStatus,
              duration: build.duration || 0,
              timestamp: build.timestamp ? new Date(build.timestamp) : new Date(),
              updatedAt: new Date(),
            },
          });
        } catch (error) {
          logger.error(`Failed to sync build #${build.number} for ${jobName}:`, error);
        }
      }
    } catch (error) {
      logger.error(`Failed to fetch builds for ${jobName}:`, error);
    }
  }

  /**
   * Map Jenkins build result to our status enum
   */
  private mapBuildResult(result: string | null): 'SUCCESS' | 'FAILURE' | 'UNSTABLE' | 'ABORTED' | 'NOT_BUILT' | 'RUNNING' {
    if (!result) return 'RUNNING';
    
    switch (result.toUpperCase()) {
      case 'SUCCESS':
        return 'SUCCESS';
      case 'FAILURE':
        return 'FAILURE';
      case 'UNSTABLE':
        return 'UNSTABLE';
      case 'ABORTED':
        return 'ABORTED';
      case 'NOT_BUILT':
        return 'NOT_BUILT';
      default:
        return 'RUNNING';
    }
  }

  /**
   * Manually trigger sync for all instances
   */
  async triggerSync(): Promise<void> {
    logger.info('Manual sync triggered');
    await this.syncAll();
  }

  /**
   * Get sync status
   */
  getStatus(): { running: boolean; isSyncing: boolean; intervalMs: number } {
    return {
      running: this.syncInterval !== null,
      isSyncing: this.isSyncing,
      intervalMs: this.intervalMs,
    };
  }
}
