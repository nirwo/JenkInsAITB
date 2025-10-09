# JenKinds Kubernetes Deployment Checklist

Complete checklist for deploying JenKinds on k3s cluster.

## ✅ Pre-Deployment Checklist

### Infrastructure
- [ ] k3s cluster installed and running
  ```bash
  sudo k3s kubectl get nodes
  ```
- [ ] kubectl configured and working
  ```bash
  kubectl version
  kubectl cluster-info
  ```
- [ ] Docker installed and running
  ```bash
  docker ps
  ```
- [ ] pnpm installed (for building)
  ```bash
  pnpm --version
  ```

### Storage
- [ ] local-path storage class available (k3s default)
  ```bash
  kubectl get storageclass
  ```
- [ ] Sufficient disk space for PVCs (minimum 8GB)
  ```bash
  df -h /var/lib/rancher/k3s/storage
  ```

### Network
- [ ] Traefik ingress controller running (k3s default)
  ```bash
  kubectl get pods -n kube-system -l app.kubernetes.io/name=traefik
  ```
- [ ] DNS configured (if using custom domain)
- [ ] Firewall rules allow required ports

## 📝 Configuration Checklist

### Secrets (CRITICAL)
- [ ] Updated `k8s/secrets.yaml` with actual values
- [ ] Jenkins URL configured
  ```yaml
  JENKINS_URL: "https://your-jenkins.com"
  ```
- [ ] Jenkins credentials configured
  ```yaml
  JENKINS_USER: "your-user"
  JENKINS_API_TOKEN: "your-token"
  ```
- [ ] OpenAI API key configured
  ```yaml
  OPENAI_API_KEY: "sk-..."
  ```
- [ ] JWT secrets generated (use: `openssl rand -base64 32`)
  ```yaml
  JWT_SECRET: "..."
  REFRESH_TOKEN_SECRET: "..."
  ```
- [ ] SMTP configured (if using email features)
  ```yaml
  SMTP_HOST: "smtp.gmail.com"
  SMTP_USER: "..."
  SMTP_PASSWORD: "..."
  ```

### ConfigMap
- [ ] Reviewed `k8s/configmap.yaml` settings
- [ ] Ports configured correctly (9010, 9011)
- [ ] Feature flags set appropriately
- [ ] Rate limits configured
- [ ] Logging level set (info for production)

### Ingress (if using)
- [ ] Updated host in `k8s/ingress.yaml`
  ```yaml
  host: jenkinds.yourdomain.com
  ```
- [ ] DNS A record points to cluster IP
- [ ] cert-manager installed (for TLS)
  ```bash
  kubectl get pods -n cert-manager
  ```
- [ ] Certificate issuer configured

### Resources
- [ ] Resource limits appropriate for your cluster
- [ ] HPA thresholds configured (70% CPU, 80% Memory)
- [ ] Storage sizes appropriate (5Gi data, 2Gi logs, 1Gi redis)

## 🔨 Build Checklist

- [ ] Source code updated to latest version
  ```bash
  git pull origin master
  ```
- [ ] Dependencies installed
  ```bash
  pnpm install
  ```
- [ ] Build successful locally (optional)
  ```bash
  pnpm build
  ```
- [ ] Docker image built
  ```bash
  docker build -t jenkinds:latest -f Dockerfile.k8s .
  ```
- [ ] Image imported to k3s (if using local registry)
  ```bash
  docker save jenkinds:latest | sudo k3s ctr images import -
  ```
- [ ] Image verified
  ```bash
  sudo k3s crictl images | grep jenkinds
  ```

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] Reviewed all manifests in `k8s/` directory
- [ ] Backup existing deployment (if upgrading)
- [ ] Deployment scripts executable
  ```bash
  chmod +x k8s/deploy.sh k8s/undeploy.sh
  ```

### Deployment Steps
- [ ] Namespace created
  ```bash
  kubectl apply -f k8s/namespace.yaml
  kubectl get namespace jenkinds
  ```
- [ ] RBAC applied
  ```bash
  kubectl apply -f k8s/rbac.yaml
  ```
- [ ] ConfigMap applied
  ```bash
  kubectl apply -f k8s/configmap.yaml
  kubectl get configmap -n jenkinds
  ```
- [ ] Secrets applied
  ```bash
  kubectl apply -f k8s/secrets.yaml
  kubectl get secret -n jenkinds
  ```
- [ ] PVCs created
  ```bash
  kubectl apply -f k8s/pvc.yaml
  kubectl get pvc -n jenkinds
  ```
- [ ] Redis deployed
  ```bash
  kubectl apply -f k8s/redis.yaml
  kubectl wait --for=condition=ready pod -l app=redis -n jenkinds --timeout=120s
  ```
- [ ] JenKinds deployed
  ```bash
  kubectl apply -f k8s/deployment.yaml
  kubectl wait --for=condition=available deployment/jenkinds -n jenkinds --timeout=180s
  ```
- [ ] HPA applied (optional)
  ```bash
  kubectl apply -f k8s/hpa.yaml
  ```
- [ ] Ingress applied (optional)
  ```bash
  kubectl apply -f k8s/ingress.yaml
  ```

## ✓ Verification Checklist

### Pod Health
- [ ] All pods running
  ```bash
  kubectl get pods -n jenkinds
  # Should show Running status
  ```
- [ ] No pod restarts
  ```bash
  kubectl get pods -n jenkinds
  # RESTARTS column should be 0
  ```
- [ ] Pods ready (1/1)
  ```bash
  kubectl get pods -n jenkinds
  # READY column should show 1/1
  ```

### Service Health
- [ ] Services created
  ```bash
  kubectl get svc -n jenkinds
  ```
- [ ] Service endpoints ready
  ```bash
  kubectl get endpoints -n jenkinds
  ```

### Storage Health
- [ ] PVCs bound
  ```bash
  kubectl get pvc -n jenkinds
  # STATUS should be Bound
  ```
- [ ] PVs created
  ```bash
  kubectl get pv | grep jenkinds
  ```

### Application Health
- [ ] Health endpoint responding
  ```bash
  POD=$(kubectl get pod -n jenkinds -l app=jenkinds -o jsonpath='{.items[0].metadata.name}')
  kubectl exec -n jenkinds $POD -- curl -s localhost:9011/health
  # Should return: {"status":"ok"}
  ```
- [ ] Readiness endpoint responding
  ```bash
  kubectl exec -n jenkinds $POD -- curl -s localhost:9011/ready
  # Should return: {"ready":true}
  ```

### Logs Clean
- [ ] No error messages in logs
  ```bash
  kubectl logs -n jenkinds -l app=jenkinds --tail=50
  ```
- [ ] No crash loops
  ```bash
  kubectl describe pod -n jenkinds -l app=jenkinds | grep -A 5 "Events:"
  ```

### Redis Health
- [ ] Redis responding
  ```bash
  kubectl exec -it -n jenkinds <redis-pod> -- redis-cli ping
  # Should return: PONG
  ```

### Resource Usage
- [ ] Resource usage reasonable
  ```bash
  kubectl top pods -n jenkinds
  ```
- [ ] No resource throttling
  ```bash
  kubectl describe pod -n jenkinds -l app=jenkinds | grep -i throttl
  ```

## 🌐 Access Checklist

### Local Access
- [ ] Port forward working
  ```bash
  kubectl port-forward -n jenkinds svc/jenkinds-service 9011:9011
  ```
- [ ] Application accessible at http://localhost:9011
- [ ] Login page loads
- [ ] Can create test user

### Ingress Access (if configured)
- [ ] DNS resolving correctly
  ```bash
  nslookup jenkinds.yourdomain.com
  ```
- [ ] TLS certificate issued
  ```bash
  kubectl get certificate -n jenkinds
  ```
- [ ] HTTPS working
- [ ] Application accessible via domain

## 👤 Post-Deployment Checklist

### User Management
- [ ] Admin user created
  ```bash
  POD=$(kubectl get pod -n jenkinds -l app=jenkinds -o jsonpath='{.items[0].metadata.name}')
  kubectl exec -it -n jenkinds $POD -- node dist/scripts/create-admin.js
  ```
- [ ] Can login with admin credentials
- [ ] Admin has correct permissions

### Jenkins Integration
- [ ] Can connect to Jenkins
- [ ] Can fetch builds
- [ ] Build data displays correctly

### AI Features
- [ ] OpenAI API key working
- [ ] Can generate AI analysis
- [ ] AI recommendations working

### Monitoring
- [ ] Metrics server installed (for HPA)
  ```bash
  kubectl top nodes
  ```
- [ ] Prometheus/Grafana configured (optional)
- [ ] Alerts configured (optional)
- [ ] Log aggregation setup (optional)

## 🔒 Security Checklist

- [ ] Secrets not committed to git
- [ ] Strong JWT secrets used (32+ characters)
- [ ] Authentication enabled (DISABLE_AUTH=false)
- [ ] TLS/HTTPS enabled for production
- [ ] RBAC permissions reviewed and minimal
- [ ] Network policies configured (optional)
- [ ] Pod security policies enabled (optional)

## 📊 Monitoring Setup

- [ ] Health checks configured
- [ ] Readiness probes working
- [ ] Liveness probes working
- [ ] Metrics endpoint accessible
- [ ] Logging to stdout/stderr
- [ ] Log retention configured

## 🔄 Backup & Recovery

- [ ] Database backup strategy defined
- [ ] PVC snapshots configured (optional)
- [ ] Disaster recovery plan documented
- [ ] Backup tested (optional)

## 📚 Documentation

- [ ] Deployment documented
- [ ] Configuration documented
- [ ] Runbooks created for common issues
- [ ] Team trained on operations
- [ ] Contact information for escalations

## 🎯 Final Verification

- [ ] All features working as expected
- [ ] Performance acceptable
- [ ] No errors in logs
- [ ] Monitoring dashboards created
- [ ] Alerts tested
- [ ] Team can access application
- [ ] Admin credentials secured
- [ ] Production readiness review complete

## 📝 Sign-Off

| Item | Status | Date | Notes |
|------|--------|------|-------|
| Infrastructure Ready | ☐ | | |
| Configuration Complete | ☐ | | |
| Deployment Successful | ☐ | | |
| Verification Passed | ☐ | | |
| Security Review | ☐ | | |
| Documentation Updated | ☐ | | |
| Team Trained | ☐ | | |
| Production Ready | ☐ | | |

---

## 🚨 Rollback Plan

If deployment fails:

1. Check logs: `kubectl logs -n jenkinds -l app=jenkinds`
2. Check events: `kubectl get events -n jenkinds --sort-by='.lastTimestamp'`
3. If critical issue, rollback:
   ```bash
   cd k8s
   ./undeploy.sh
   ```
4. Fix issue and redeploy

---

**Deployment Date:** _______________

**Deployed By:** _______________

**Sign-Off:** _______________

---

🎉 **Ready for Production!**
