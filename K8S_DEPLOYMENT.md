# JenKinds - Kubernetes/k3s Deployment Guide

Complete guide for deploying JenKinds on a k3s Kubernetes cluster.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Detailed Setup](#detailed-setup)
- [Configuration](#configuration)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

---

## 🔧 Prerequisites

### Required Tools

1. **k3s** (or any Kubernetes cluster)
   ```bash
   # Install k3s
   curl -sfL https://get.k3s.io | sh -
   
   # Check installation
   sudo k3s kubectl get nodes
   ```

2. **kubectl**
   ```bash
   # Install kubectl
   curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
   chmod +x kubectl
   sudo mv kubectl /usr/local/bin/
   
   # For k3s, configure kubectl
   mkdir -p ~/.kube
   sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
   sudo chown $USER ~/.kube/config
   ```

3. **Docker**
   ```bash
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   ```

4. **pnpm** (for building)
   ```bash
   npm install -g pnpm
   ```

### Optional Tools

- **Traefik** (included in k3s by default)
- **cert-manager** (for TLS certificates)
  ```bash
  kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
  ```

---

## 🚀 Quick Start

### Automated Deployment

1. **Make the deploy script executable:**
   ```bash
   chmod +x k8s/deploy.sh
   ```

2. **Configure secrets:**
   Edit `k8s/secrets.yaml` and replace the placeholder values with your actual credentials.

3. **Run deployment:**
   ```bash
   cd k8s
   ./deploy.sh
   ```

4. **Select option 1** (Build and deploy)

5. **Access the application:**
   ```bash
   kubectl port-forward -n jenkinds svc/jenkinds-service 9011:9011
   ```
   Then open: http://localhost:9011

---

## 📖 Detailed Setup

### Step 1: Configure Secrets

Edit `k8s/secrets.yaml` with your actual credentials:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: jenkinds-secrets
  namespace: jenkinds
type: Opaque
stringData:
  # Jenkins Configuration
  JENKINS_URL: "https://your-jenkins.com"
  JENKINS_USER: "your-jenkins-user"
  JENKINS_API_TOKEN: "your-jenkins-api-token"
  
  # OpenAI API Key
  OPENAI_API_KEY: "sk-your-openai-api-key"
  
  # JWT Secrets (generate with: openssl rand -base64 32)
  JWT_SECRET: "your-jwt-secret"
  REFRESH_TOKEN_SECRET: "your-refresh-token-secret"
  
  # SMTP Configuration (optional)
  SMTP_HOST: "smtp.gmail.com"
  SMTP_PORT: "587"
  SMTP_USER: "your-email@gmail.com"
  SMTP_PASSWORD: "your-app-password"
  
  # Sentry (optional)
  SENTRY_DSN: ""
```

**Generate secure secrets:**
```bash
# Generate JWT secrets
openssl rand -base64 32

# Or use node
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Step 2: Build Docker Image

**For k3s (local):**
```bash
# Build image from project root
docker build -t jenkinds:latest -f Dockerfile.k8s .

# Or from k8s/ directory
cd k8s
docker build -t jenkinds:latest -f ../Dockerfile.k8s ..

# Import to k3s
docker save jenkinds:latest | sudo k3s ctr images import -
```

**For remote registry:**
```bash
# Build and tag (from project root)
docker build -t your-registry.com/jenkinds:latest -f Dockerfile.k8s .

# Push to registry
docker push your-registry.com/jenkinds:latest

# Update k8s/deployment.yaml to use your registry
```

### Step 3: Deploy to Kubernetes

**Deploy in order:**

1. **Namespace:**
   ```bash
   kubectl apply -f k8s/namespace.yaml
   ```

2. **RBAC:**
   ```bash
   kubectl apply -f k8s/rbac.yaml
   ```

3. **ConfigMap:**
   ```bash
   kubectl apply -f k8s/configmap.yaml
   ```

4. **Secrets:**
   ```bash
   kubectl apply -f k8s/secrets.yaml
   ```

5. **PersistentVolumeClaims:**
   ```bash
   kubectl apply -f k8s/pvc.yaml
   ```

6. **Redis:**
   ```bash
   kubectl apply -f k8s/redis.yaml
   
   # Wait for Redis to be ready
   kubectl wait --for=condition=ready pod -l app=redis -n jenkinds --timeout=120s
   ```

7. **JenKinds Application:**
   ```bash
   kubectl apply -f k8s/deployment.yaml
   
   # Wait for deployment
   kubectl wait --for=condition=available deployment/jenkinds -n jenkinds --timeout=180s
   ```

8. **HPA (Optional):**
   ```bash
   kubectl apply -f k8s/hpa.yaml
   ```

9. **Ingress (Optional):**
   ```bash
   # Update host in k8s/ingress.yaml first
   kubectl apply -f k8s/ingress.yaml
   ```

### Step 4: Verify Deployment

```bash
# Check all resources
kubectl get all -n jenkinds

# Check pod logs
kubectl logs -f -n jenkinds -l app=jenkinds

# Check pod status
kubectl describe pod -n jenkinds -l app=jenkinds
```

### Step 5: Access Application

**Option 1: Port Forward (Development)**
```bash
kubectl port-forward -n jenkinds svc/jenkinds-service 9011:9011
```
Access: http://localhost:9011

**Option 2: NodePort**

Edit `k8s/deployment.yaml` Service section:
```yaml
spec:
  type: NodePort
  ports:
    - port: 9011
      targetPort: 9011
      nodePort: 30911  # Choose port 30000-32767
```

Access: http://<node-ip>:30911

**Option 3: Ingress (Production)**

1. Update `k8s/ingress.yaml` with your domain:
   ```yaml
   spec:
     rules:
       - host: jenkinds.yourdomain.com
   ```

2. Configure DNS to point to your cluster

3. Access: https://jenkinds.yourdomain.com

### Step 6: Create Admin User

```bash
# Get pod name
POD=$(kubectl get pod -n jenkinds -l app=jenkinds -o jsonpath='{.items[0].metadata.name}')

# Run create-admin script
kubectl exec -it -n jenkinds $POD -- node dist/scripts/create-admin.js

# Or use interactive script
kubectl exec -it -n jenkinds $POD -- node dist/scripts/create-admin-interactive.js
```

---

## ⚙️ Configuration

### Environment Variables

All configuration is in `k8s/configmap.yaml`:

- **NODE_ENV**: `production`
- **Ports**: `9010` (frontend), `9011` (backend)
- **Database**: SQLite at `/data/prisma/dev.db`
- **Redis**: `redis://redis-service:6379`
- **Jenkins**: URL, user, credentials
- **AI**: OpenAI settings
- **Auth**: JWT, session settings
- **Features**: AI analysis, recommendations, caching

### Storage

Three PersistentVolumeClaims are created:

1. **jenkinds-data** (5Gi): Application data and database
2. **jenkinds-logs** (2Gi): Application logs
3. **redis-data** (1Gi): Redis persistence

**Storage class:** `local-path` (k3s default)

### Resource Limits

**JenKinds Pod:**
- Requests: 512Mi RAM, 250m CPU
- Limits: 2Gi RAM, 1000m CPU

**Redis Pod:**
- Requests: 128Mi RAM, 100m CPU
- Limits: 256Mi RAM, 200m CPU

### Auto-Scaling

HPA configuration (1-5 replicas):
- CPU target: 70%
- Memory target: 80%

**Note:** Requires metrics-server:
```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

---

## 📊 Monitoring

### Check Application Health

```bash
# Health check
kubectl exec -n jenkinds -it <pod-name> -- curl localhost:9011/health

# Readiness check
kubectl exec -n jenkinds -it <pod-name> -- curl localhost:9011/ready
```

### View Logs

```bash
# Application logs
kubectl logs -f -n jenkinds -l app=jenkinds

# Redis logs
kubectl logs -f -n jenkinds -l app=redis

# Previous crashed container
kubectl logs -n jenkinds -l app=jenkinds --previous
```

### Metrics

```bash
# Resource usage
kubectl top pods -n jenkinds

# HPA status
kubectl get hpa -n jenkinds

# Deployment status
kubectl rollout status deployment/jenkinds -n jenkinds
```

### Prometheus (if installed)

The application exposes metrics at `/metrics` endpoint.

---

## 🔍 Troubleshooting

### Common Issues

#### 1. Pod Not Starting

```bash
# Check pod status
kubectl describe pod -n jenkinds -l app=jenkinds

# Check events
kubectl get events -n jenkinds --sort-by='.lastTimestamp'

# Check logs
kubectl logs -n jenkinds -l app=jenkinds
```

**Common causes:**
- Image not available (check imagePullPolicy)
- Secrets not configured
- Insufficient resources
- Database initialization failed

#### 2. Database Connection Issues

```bash
# Check if data PVC is bound
kubectl get pvc -n jenkinds

# Check database file permissions
kubectl exec -it -n jenkinds <pod-name> -- ls -la /data/prisma/

# Run database migration
kubectl exec -it -n jenkinds <pod-name> -- npx prisma migrate deploy
```

#### 3. Redis Connection Issues

```bash
# Check Redis pod
kubectl get pod -n jenkinds -l app=redis

# Test Redis connection
kubectl exec -it -n jenkinds <redis-pod> -- redis-cli ping

# Check Redis logs
kubectl logs -n jenkinds -l app=redis
```

#### 4. Image Pull Issues

**For k3s local images:**
```bash
# Check if image exists
sudo k3s crictl images | grep jenkinds

# Re-import image
docker save jenkinds:latest | sudo k3s ctr images import -
```

**For registry images:**
```bash
# Check image pull policy
kubectl get deployment jenkinds -n jenkinds -o yaml | grep imagePullPolicy

# Create image pull secret if needed
kubectl create secret docker-registry regcred \
  --docker-server=your-registry.com \
  --docker-username=your-user \
  --docker-password=your-password \
  -n jenkinds
```

#### 5. Application Not Responding

```bash
# Check if service endpoints are ready
kubectl get endpoints -n jenkinds

# Test from within cluster
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -n jenkinds -- \
  curl http://jenkinds-service:9011/health

# Port forward and test locally
kubectl port-forward -n jenkinds svc/jenkinds-service 9011:9011
curl http://localhost:9011/health
```

### Useful Commands

```bash
# Interactive shell in pod
kubectl exec -it -n jenkinds <pod-name> -- sh

# Copy files from pod
kubectl cp jenkinds/<pod-name>:/app/logs/combined.log ./local-logs.log

# Restart deployment
kubectl rollout restart deployment/jenkinds -n jenkinds

# Scale deployment
kubectl scale deployment/jenkinds --replicas=3 -n jenkinds

# View full deployment config
kubectl get deployment jenkinds -n jenkinds -o yaml
```

### Performance Issues

1. **Check resource usage:**
   ```bash
   kubectl top pod -n jenkinds
   ```

2. **Review HPA status:**
   ```bash
   kubectl describe hpa jenkinds-hpa -n jenkinds
   ```

3. **Check database size:**
   ```bash
   kubectl exec -it -n jenkinds <pod-name> -- du -sh /data/prisma/
   ```

4. **Review application logs for slow queries:**
   ```bash
   kubectl logs -n jenkinds -l app=jenkinds | grep -i slow
   ```

---

## 🔄 Updates and Rollbacks

### Update Application

```bash
# Build new image with version tag
docker build -t jenkinds:v1.1.0 -f Dockerfile.k8s .

# Import to k3s
docker save jenkinds:v1.1.0 | sudo k3s ctr images import -

# Update deployment
kubectl set image deployment/jenkinds jenkinds=jenkinds:v1.1.0 -n jenkinds

# Watch rollout
kubectl rollout status deployment/jenkinds -n jenkinds
```

### Rollback

```bash
# View rollout history
kubectl rollout history deployment/jenkinds -n jenkinds

# Rollback to previous version
kubectl rollout undo deployment/jenkinds -n jenkinds

# Rollback to specific revision
kubectl rollout undo deployment/jenkinds --to-revision=2 -n jenkinds
```

---

## 🗑️ Cleanup

### Remove Application

```bash
# Using undeploy script
chmod +x k8s/undeploy.sh
./k8s/undeploy.sh

# Manual cleanup
kubectl delete -f k8s/ingress.yaml
kubectl delete -f k8s/hpa.yaml
kubectl delete -f k8s/deployment.yaml
kubectl delete -f k8s/redis.yaml
kubectl delete -f k8s/pvc.yaml  # This deletes data!
kubectl delete -f k8s/secrets.yaml
kubectl delete -f k8s/configmap.yaml
kubectl delete -f k8s/rbac.yaml
kubectl delete -f k8s/namespace.yaml
```

---

## 📚 Additional Resources

- [k3s Documentation](https://docs.k3s.io/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Traefik Documentation](https://doc.traefik.io/traefik/)
- [cert-manager Documentation](https://cert-manager.io/docs/)

---

## 🆘 Support

For issues and questions:
- Check logs: `kubectl logs -f -n jenkinds -l app=jenkinds`
- Review events: `kubectl get events -n jenkinds`
- Check pod status: `kubectl describe pod -n jenkinds -l app=jenkinds`

---

**Happy Deploying! 🚀**
