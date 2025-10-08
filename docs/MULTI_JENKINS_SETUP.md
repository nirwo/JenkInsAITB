# Multi-Jenkins Master Setup with Load Balancing

## Overview

JenKinds now supports multiple Jenkins master instances with intelligent load balancing, health checking, and automatic failover. All communication uses secure token-based authentication.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     JenKinds Platform                     │
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │         Jenkins Load Balancer                    │   │
│  │  - Health Monitoring                             │   │
│  │  - Load Distribution                             │   │
│  │  - Automatic Failover                            │   │
│  └─────────────────────────────────────────────────┘   │
│                          │                                │
│              ┌───────────┼───────────┐                   │
│              │           │           │                    │
│  ┌───────────▼─┐  ┌─────▼──────┐  ┌▼──────────┐        │
│  │ Jenkins      │  │ Jenkins    │  │ Jenkins   │        │
│  │ Master 1     │  │ Master 2   │  │ Master 3  │        │
│  │ (Primary)    │  │ (Backup)   │  │ (Backup)  │        │
│  │ Priority: 10 │  │ Priority: 5│  │ Priority: 5│       │
│  └──────────────┘  └────────────┘  └───────────┘        │
│   Token Auth       Token Auth       Token Auth          │
└─────────────────────────────────────────────────────────┘
```

## Features

### 1. **Token-Based Authentication**
- All Jenkins instances use API tokens (not passwords)
- Tokens are encrypted in database
- Support for both user and service account tokens

### 2. **Load Balancing Strategies**

#### **Least Load (Default)**
Selects instance with lowest current load.

#### **Round Robin**
Distributes requests evenly across all healthy instances.

#### **Weighted**
Uses priority values to prefer certain instances.

#### **Primary/Backup**
Routes to primary master, fails over to backups if unhealthy.

### 3. **Health Monitoring**
- Automatic health checks every 30 seconds
- Configurable health check endpoints
- Status tracking: `healthy`, `degraded`, `unhealthy`
- Automatic instance removal from pool when unhealthy

### 4. **Clustering**
- Group instances into clusters using `clusterId`
- Each cluster operates independently
- Can have cluster-specific load balancers

### 5. **Container Support**
- Designed for containerized Jenkins masters
- Works with Docker, Kubernetes, Docker Swarm
- Supports dynamic instance scaling

## Setup Guide

### Step 1: Deploy Jenkins Masters

#### Using Docker Compose

```yaml
# docker-compose.jenkins.yml
version: '3.8'

services:
  jenkins-master-1:
    image: jenkins/jenkins:lts
    container_name: jenkins-master-1
    environment:
      - JENKINS_OPTS=--prefix=/jenkins
    volumes:
      - jenkins-master-1-data:/var/jenkins_home
    networks:
      - jenkins-network
    ports:
      - "8081:8080"

  jenkins-master-2:
    image: jenkins/jenkins:lts
    container_name: jenkins-master-2
    environment:
      - JENKINS_OPTS=--prefix=/jenkins
    volumes:
      - jenkins-master-2-data:/var/jenkins_home
    networks:
      - jenkins-network
    ports:
      - "8082:8080"

  jenkins-master-3:
    image: jenkins/jenkins:lts
    container_name: jenkins-master-3
    environment:
      - JENKINS_OPTS=--prefix=/jenkins
    volumes:
      - jenkins-master-3-data:/var/jenkins_home
    networks:
      - jenkins-network
    ports:
      - "8083:8080"

  jenkins-loadbalancer:
    image: nginx:alpine
    container_name: jenkins-lb
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    ports:
      - "8080:80"
    networks:
      - jenkins-network
    depends_on:
      - jenkins-master-1
      - jenkins-master-2
      - jenkins-master-3

volumes:
  jenkins-master-1-data:
  jenkins-master-2-data:
  jenkins-master-3-data:

networks:
  jenkins-network:
    driver: bridge
```

#### Nginx Load Balancer Configuration

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream jenkins_backend {
        least_conn;
        
        server jenkins-master-1:8080 max_fails=3 fail_timeout=30s;
        server jenkins-master-2:8080 max_fails=3 fail_timeout=30s;
        server jenkins-master-3:8080 max_fails=3 fail_timeout=30s;
    }

    server {
        listen 80;

        location / {
            proxy_pass http://jenkins_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # WebSocket support
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }

        location /health {
            access_log off;
            return 200 "healthy\n";
        }
    }
}
```

### Step 2: Generate API Tokens

For each Jenkins master:

1. Log in to Jenkins web UI
2. Go to **User** → **Configure**
3. Click **Add new Token** under API Token section
4. Give it a name (e.g., "jenkinds-monitoring")
5. Click **Generate**
6. **Copy the token immediately** (it won't be shown again)

### Step 3: Register Instances in JenKinds

Using the API:

```typescript
// Register Primary Master
await trpc.jenkins.createInstance.mutate({
  name: 'Jenkins Master 1 (Primary)',
  url: 'http://jenkins-master-1:8080',
  username: 'admin',
  apiToken: 'your-api-token-here',
  description: 'Primary Jenkins master for production builds',
  isPrimary: true,
  clusterId: 'production',
  loadBalancerUrl: 'http://jenkins-lb:80',
  priority: 10,
  healthCheckUrl: 'http://jenkins-master-1:8080/api/json',
  maxConnections: 100,
});

// Register Backup Masters
await trpc.jenkins.createInstance.mutate({
  name: 'Jenkins Master 2 (Backup)',
  url: 'http://jenkins-master-2:8080',
  username: 'admin',
  apiToken: 'your-api-token-here',
  isPrimary: false,
  clusterId: 'production',
  loadBalancerUrl: 'http://jenkins-lb:80',
  priority: 5,
  maxConnections: 100,
});

await trpc.jenkins.createInstance.mutate({
  name: 'Jenkins Master 3 (Backup)',
  url: 'http://jenkins-master-3:8080',
  username: 'admin',
  apiToken: 'your-api-token-here',
  isPrimary: false,
  clusterId: 'production',
  loadBalancerUrl: 'http://jenkins-lb:80',
  priority: 5,
  maxConnections: 100,
});
```

### Step 4: Enable Health Monitoring

Health checks run automatically, but you can manually trigger them:

```typescript
await trpc.jenkins.performHealthChecks.mutate();
```

### Step 5: Test the Setup

```typescript
// Get optimal instance for requests
const instance = await trpc.jenkins.getOptimalInstance.query({
  clusterId: 'production',
});

console.log(`Selected: ${instance.name} (Load: ${instance.currentLoad}/${instance.maxConnections})`);

// View all clusters
const clusters = await trpc.jenkins.getClusters.query();

clusters.forEach(cluster => {
  console.log(`Cluster: ${cluster.clusterId}`);
  console.log(`  Instances: ${cluster.totalInstances}`);
  console.log(`  Healthy: ${cluster.healthyInstances}`);
  console.log(`  Load: ${cluster.totalLoad}/${cluster.totalCapacity}`);
});
```

## API Reference

### Create Instance

```typescript
trpc.jenkins.createInstance.mutate({
  name: string;                    // Display name
  url: string;                     // Direct Jenkins URL
  username: string;                // Jenkins username
  apiToken: string;                // API token (required)
  description?: string;            // Optional description
  isPrimary?: boolean;             // Mark as primary (default: false)
  clusterId?: string;              // Cluster identifier
  loadBalancerUrl?: string;        // Load balancer endpoint
  priority?: number;               // Priority (0-100, default: 0)
  healthCheckUrl?: string;         // Custom health endpoint
  maxConnections?: number;         // Max concurrent (default: 100)
});
```

### Get Optimal Instance

```typescript
const instance = await trpc.jenkins.getOptimalInstance.query({
  clusterId?: string;  // Optional: filter by cluster
});
```

### Get All Clusters

```typescript
const clusters = await trpc.jenkins.getClusters.query();
// Returns: Array of cluster info with instances, load, health status
```

### Get Instance Stats

```typescript
const stats = await trpc.jenkins.getInstanceStats.query({
  instanceId: string;
});

// Returns:
// {
//   instanceId, name, currentLoad, maxConnections,
//   utilizationPercent, healthStatus, lastHealthCheck,
//   totalJobs, activeJobs, totalExecutors, idleExecutors,
//   busyExecutors, executorUtilization
// }
```

### Update Instance

```typescript
await trpc.jenkins.updateInstance.mutate({
  id: string;
  // Any field from creation can be updated
  priority?: number;
  maxConnections?: number;
  isActive?: boolean;
  // ...
});
```

### Delete Instance

```typescript
await trpc.jenkins.deleteInstance.mutate({
  id: string;
});
```

### Test Connection

```typescript
const result = await trpc.jenkins.testConnection.mutate({
  url: string;
  username: string;
  apiToken: string;
});

// Returns: { success: boolean, version: string, message: string }
```

## Load Balancing Strategies

The system supports multiple load balancing strategies accessible via the `JenkinsLoadBalancer` class:

```typescript
import { JenkinsLoadBalancer } from './infrastructure/loadbalancer/jenkins-loadbalancer';

const lb = new JenkinsLoadBalancer(prisma);

// Least load (default)
const instance1 = await lb.getOptimalInstance('production');

// Round robin
const instance2 = await lb.getRoundRobinInstance('production');

// Weighted by priority
const instance3 = await lb.getWeightedInstance('production');

// Get primary master
const primary = await lb.getPrimaryMaster('production');

// Manual failover
const backup = await lb.failoverToPrimary('production', currentMasterId);
```

## Monitoring & Metrics

### Health Check Schedule

Configure in your environment:

```bash
HEALTH_CHECK_INTERVAL=30000  # 30 seconds
HEALTH_CHECK_TIMEOUT=5000    # 5 seconds
```

### Prometheus Metrics

The following metrics are exported:

- `jenkins_instance_load` - Current load per instance
- `jenkins_instance_health` - Health status (1=healthy, 0=unhealthy)
- `jenkins_instance_utilization` - Utilization percentage
- `jenkins_cluster_size` - Number of instances per cluster
- `jenkins_requests_total` - Total requests per instance

## Security Best Practices

1. **Never use passwords** - Always use API tokens
2. **Rotate tokens regularly** - Jenkins allows multiple tokens
3. **Use service accounts** - Create dedicated Jenkins users for monitoring
4. **Encrypt at rest** - API tokens are encrypted in database
5. **Use HTTPS** - Always configure SSL/TLS for Jenkins
6. **Network isolation** - Keep Jenkins masters in private network
7. **Firewall rules** - Only allow JenKinds IP to connect

## Troubleshooting

### Instance Shows Unhealthy

```bash
# Check connection manually
curl -u username:token http://jenkins-url/api/json

# View health check logs
docker logs jenkins-master-1

# Manually trigger health check
pnpm db:seed # Will run health checks
```

### Load Not Distributing

- Check all instances are marked `isActive: true`
- Verify health status is `healthy`
- Check `priority` values are set correctly
- Review load balancer configuration

### High Latency

- Increase `maxConnections` per instance
- Add more instances to cluster
- Enable Redis caching (already configured)
- Check network between JenKinds and Jenkins

## Migration from Single Instance

If you have existing Jenkins setup:

1. Keep current instance as primary
2. Add new instances as backups
3. Gradually increase priority of new instances
4. Monitor load distribution
5. Decommission old instance when stable

---

**🚀 Your multi-Jenkins setup is ready!**

For questions, see: `STATUS.md` or `Readme.MD`
