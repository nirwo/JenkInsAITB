import { JenkinsInstance } from '@prisma/client';
import { logger } from '../../common/utils/logger';

/**
 * Jenkins API Client
 * Handles communication with Jenkins master instances using token-based authentication
 */
export class JenkinsClient {
  private baseUrl: string;
  private auth: string;

  constructor(instance: JenkinsInstance) {
    // Use load balancer URL if available, otherwise direct URL
    this.baseUrl = instance.loadBalancerUrl || instance.url;
    this.auth = Buffer.from(`${instance.username}:${instance.apiToken}`).toString('base64');
  }

  /**
   * Make authenticated request to Jenkins
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          Authorization: `Basic ${this.auth}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`Jenkins API error: ${response.status} ${response.statusText}`);
      }

      return response.json() as Promise<T>;
    } catch (error) {
      logger.error(`Jenkins API request failed for ${url}:`, error);
      throw error;
    }
  }

  /**
   * Get all jobs
   */
  async getJobs(): Promise<any[]> {
    const data = await this.request<any>('/api/json?tree=jobs[name,url,color,lastBuild[number,url]]');
    return data.jobs || [];
  }

  /**
   * Get job details
   */
  async getJob(jobName: string): Promise<any> {
    return this.request(`/job/${encodeURIComponent(jobName)}/api/json`);
  }

  /**
   * Get builds for a job
   */
  async getBuilds(jobName: string, limit: number = 20): Promise<any[]> {
    const data = await this.request<any>(
      `/job/${encodeURIComponent(jobName)}/api/json?tree=builds[number,url,result,timestamp,duration]{0,${limit}}`
    );
    return data.builds || [];
  }

  /**
   * Get build details
   */
  async getBuild(jobName: string, buildNumber: number): Promise<any> {
    return this.request(`/job/${encodeURIComponent(jobName)}/${buildNumber}/api/json`);
  }

  /**
   * Get console output for a build
   */
  async getConsoleOutput(jobName: string, buildNumber: number): Promise<string> {
    const url = `${this.baseUrl}/job/${encodeURIComponent(jobName)}/${buildNumber}/consoleText`;
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Basic ${this.auth}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get console output: ${response.statusText}`);
    }

    return response.text();
  }

  /**
   * Trigger a build
   */
  async triggerBuild(jobName: string, parameters?: Record<string, any>): Promise<void> {
    const endpoint = parameters
      ? `/job/${encodeURIComponent(jobName)}/buildWithParameters`
      : `/job/${encodeURIComponent(jobName)}/build`;

    await this.request(endpoint, {
      method: 'POST',
      body: parameters ? JSON.stringify(parameters) : undefined,
    });
  }

  /**
   * Get executors
   */
  async getExecutors(): Promise<any[]> {
    const data = await this.request<any>('/computer/api/json?tree=computer[displayName,idle,offline,executors[idle,currentExecutable[url]]]');
    return data.computer || [];
  }

  /**
   * Get queue items
   */
  async getQueue(): Promise<any[]> {
    const data = await this.request<any>('/queue/api/json');
    return data.items || [];
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.request('/api/json');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get system info
   */
  async getSystemInfo(): Promise<any> {
    return this.request('/api/json');
  }
}

/**
 * Jenkins Client Factory
 * Creates clients for multiple Jenkins instances with load balancing support
 */
export class JenkinsClientFactory {
  private clients: Map<string, JenkinsClient> = new Map();

  /**
   * Get or create client for instance
   */
  getClient(instance: JenkinsInstance): JenkinsClient {
    const key = instance.id;
    
    if (!this.clients.has(key)) {
      this.clients.set(key, new JenkinsClient(instance));
    }

    return this.clients.get(key)!;
  }

  /**
   * Remove client from cache
   */
  removeClient(instanceId: string): void {
    this.clients.delete(instanceId);
  }

  /**
   * Clear all clients
   */
  clearAll(): void {
    this.clients.clear();
  }
}

// Export singleton instance
export const jenkinsClientFactory = new JenkinsClientFactory();
