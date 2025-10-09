# Kubernetes Deployment Files

This directory contains all Kubernetes manifests for deploying JenKinds on a k3s cluster.

## 📁 Files Overview

| File | Description |
|------|-------------|
| `namespace.yaml` | Creates the `jenkinds` namespace for resource isolation |
| `configmap.yaml` | Non-sensitive configuration (ports, URLs, feature flags) |
| `secrets.yaml` | Sensitive credentials (API keys, passwords) - **MUST BE UPDATED** |
| `pvc.yaml` | Persistent storage claims (data, logs, redis) |
| `redis.yaml` | Redis cache deployment and service |
| `deployment.yaml` | Main JenKinds application deployment and service |
| `ingress.yaml` | Traefik ingress for external access with TLS |
| `hpa.yaml` | Horizontal Pod Autoscaler for scaling |
| `rbac.yaml` | ServiceAccount, Role, and RoleBinding for permissions |

## 🚀 Quick Start

```bash
# 1. Configure secrets
vi secrets.yaml  # Update all placeholder values

# 2. Run deployment script
chmod +x deploy.sh
./deploy.sh
```

## 📖 Manual Deployment

Deploy in this order:

```bash
# 1. Namespace
kubectl apply -f namespace.yaml

# 2. RBAC
kubectl apply -f rbac.yaml

# 3. Configuration
kubectl apply -f configmap.yaml
kubectl apply -f secrets.yaml

# 4. Storage
kubectl apply -f pvc.yaml

# 5. Dependencies
kubectl apply -f redis.yaml

# Wait for Redis
kubectl wait --for=condition=ready pod -l app=redis -n jenkinds --timeout=120s

# 6. Application
kubectl apply -f deployment.yaml

# Wait for app
kubectl wait --for=condition=available deployment/jenkinds -n jenkinds --timeout=180s

# 7. Optional: Scaling and routing
kubectl apply -f hpa.yaml
kubectl apply -f ingress.yaml  # Update host first!
```

## ⚙️ Configuration

### Secrets (REQUIRED)

Before deploying, update `secrets.yaml` with your actual values:

```yaml
JENKINS_URL: "https://your-jenkins.com"
JENKINS_USER: "your-username"
JENKINS_API_TOKEN: "your-token"
OPENAI_API_KEY: "sk-your-key"
JWT_SECRET: "generate-with-openssl-rand-base64-32"
REFRESH_TOKEN_SECRET: "generate-with-openssl-rand-base64-32"
```

Generate secure secrets:
```bash
openssl rand -base64 32
```

### ConfigMap

Edit `configmap.yaml` to customize:
- Ports (default: 9010, 9011)
- Feature flags (AI_ANALYSIS_ENABLED, etc.)
- Rate limiting
- Logging level

### Ingress

Update `ingress.yaml` with your domain:
```yaml
spec:
  rules:
    - host: jenkinds.yourdomain.com  # Change this
```

## 📊 Monitoring

```bash
# View all resources
kubectl get all -n jenkinds

# Check logs
kubectl logs -f -n jenkinds -l app=jenkinds

# Check pod status
kubectl describe pod -n jenkinds -l app=jenkinds

# View events
kubectl get events -n jenkinds --sort-by='.lastTimestamp'

# Resource usage
kubectl top pods -n jenkinds
```

## 🔧 Common Operations

### Port Forward (Local Access)
```bash
kubectl port-forward -n jenkinds svc/jenkinds-service 9011:9011
```
Access: http://localhost:9011

### Scale Application
```bash
kubectl scale deployment/jenkinds --replicas=3 -n jenkinds
```

### Update Image
```bash
kubectl set image deployment/jenkinds jenkinds=jenkinds:v1.1.0 -n jenkinds
```

### Restart Deployment
```bash
kubectl rollout restart deployment/jenkinds -n jenkinds
```

### View Secrets (base64 decoded)
```bash
kubectl get secret jenkinds-secrets -n jenkinds -o jsonpath='{.data.JENKINS_URL}' | base64 -d
```

### Edit ConfigMap
```bash
kubectl edit configmap jenkinds-config -n jenkinds
# Then restart deployment to apply changes
```

## 🗑️ Cleanup

```bash
# Quick cleanup (keeps PVCs)
./undeploy.sh

# Full cleanup (deletes data)
kubectl delete namespace jenkinds
```

## 🐛 Troubleshooting

### Pod Not Starting

```bash
# Check pod details
kubectl describe pod -n jenkinds -l app=jenkinds

# Check logs
kubectl logs -n jenkinds -l app=jenkinds

# Check events
kubectl get events -n jenkinds
```

### Image Pull Issues

```bash
# For k3s, check if image exists
sudo k3s crictl images | grep jenkinds

# Re-import image
docker save jenkinds:latest | sudo k3s ctr images import -
```

### Database Issues

```bash
# Check PVC status
kubectl get pvc -n jenkinds

# Access pod shell
kubectl exec -it -n jenkinds <pod-name> -- sh

# Inside pod: check database
ls -la /data/prisma/
```

### Redis Connection Issues

```bash
# Check Redis pod
kubectl get pod -n jenkinds -l app=redis

# Test Redis
kubectl exec -it -n jenkinds <redis-pod> -- redis-cli ping
```

## 📚 Resources

- **Architecture**: Application uses SQLite database, Redis cache, tRPC API
- **Storage**: local-path storage class (k3s default)
- **Ingress**: Traefik (included in k3s)
- **TLS**: cert-manager with Let's Encrypt

## 🔒 Security Notes

1. **Always update secrets.yaml** before deploying
2. Never commit secrets to git (already in .gitignore)
3. Use strong, randomly generated JWT secrets
4. Enable authentication in production (DISABLE_AUTH=false)
5. Use TLS/HTTPS for production deployments
6. Review RBAC permissions periodically

### Next Steps

1. ✅ Update `secrets.yaml` with your credentials ⭐
2. ✅ Review configuration in `configmap.yaml`
3. ✅ Build Docker image: `cd .. && docker build -t jenkinds:latest -f Dockerfile.k8s .`
4. ✅ Import to k3s: `docker save jenkinds:latest | sudo k3s ctr images import -`
5. ✅ Deploy: `cd k8s && ./deploy.sh`
6. ✅ Create admin user
7. ✅ Configure monitoring/alerting
8. ✅ Set up backups

---

For detailed documentation, see: [K8S_DEPLOYMENT.md](../K8S_DEPLOYMENT.md)
