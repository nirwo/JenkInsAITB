# JenKinds Kubernetes Monitoring & Observability

Guide for monitoring your JenKinds deployment on k3s.

## 📊 Built-in Monitoring

### Health Checks

The application exposes health endpoints:

```bash
# Health check (liveness probe)
kubectl exec -n jenkinds -it <pod-name> -- curl localhost:9011/health

# Readiness check
kubectl exec -n jenkinds -it <pod-name> -- curl localhost:9011/ready

# From outside cluster (with port-forward)
kubectl port-forward -n jenkinds svc/jenkinds-service 9011:9011
curl http://localhost:9011/health
```

### Kubernetes Native Monitoring

```bash
# Resource usage
kubectl top pods -n jenkinds
kubectl top nodes

# Pod status
kubectl get pods -n jenkinds -w

# Deployment status
kubectl rollout status deployment/jenkinds -n jenkinds

# Events
kubectl get events -n jenkinds --sort-by='.lastTimestamp'

# HPA status
kubectl get hpa -n jenkinds
kubectl describe hpa jenkinds-hpa -n jenkinds
```

## 📝 Logging

### View Application Logs

```bash
# Tail logs
kubectl logs -f -n jenkinds -l app=jenkinds

# Logs from specific pod
kubectl logs -n jenkinds <pod-name>

# Previous container logs (if crashed)
kubectl logs -n jenkinds <pod-name> --previous

# Last 100 lines
kubectl logs -n jenkinds -l app=jenkinds --tail=100

# Since specific time
kubectl logs -n jenkinds -l app=jenkinds --since=1h

# All containers in pod
kubectl logs -n jenkinds <pod-name> --all-containers=true
```

### Redis Logs

```bash
kubectl logs -f -n jenkinds -l app=redis
```

### Export Logs

```bash
# Export to file
kubectl logs -n jenkinds -l app=jenkinds > jenkinds-logs.txt

# Copy logs from pod
kubectl cp jenkinds/<pod-name>:/app/logs/combined.log ./local-combined.log
kubectl cp jenkinds/<pod-name>:/app/logs/error.log ./local-error.log
```

## 📈 Metrics Server (Required for HPA)

### Install Metrics Server

```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

For k3s, you might need to modify the deployment:

```bash
kubectl patch deployment metrics-server -n kube-system --type='json' \
  -p='[{"op": "add", "path": "/spec/template/spec/containers/0/args/-", "value": "--kubelet-insecure-tls"}]'
```

### Verify Metrics Server

```bash
# Check if metrics are available
kubectl top nodes
kubectl top pods -n jenkinds

# Check metrics-server logs
kubectl logs -n kube-system -l k8s-app=metrics-server
```

## 🔍 Prometheus & Grafana (Optional)

### Deploy Prometheus Stack

Using kube-prometheus-stack:

```bash
# Add Prometheus Helm repo
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install with custom values
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false
```

### Create ServiceMonitor for JenKinds

Create `k8s/monitoring/servicemonitor.yaml`:

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: jenkinds-metrics
  namespace: jenkinds
  labels:
    app: jenkinds
spec:
  selector:
    matchLabels:
      app: jenkinds
  endpoints:
    - port: http
      path: /metrics
      interval: 30s
```

Apply:
```bash
kubectl apply -f k8s/monitoring/servicemonitor.yaml
```

### Access Grafana

```bash
# Get Grafana admin password
kubectl get secret -n monitoring prometheus-grafana \
  -o jsonpath="{.data.admin-password}" | base64 -d

# Port forward
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80
```

Access: http://localhost:3000
- Username: `admin`
- Password: (from command above)

### Grafana Dashboard

Import these dashboards:
- **Kubernetes Cluster Monitoring**: Dashboard ID `7249`
- **Node Exporter Full**: Dashboard ID `1860`
- **PostgreSQL Database**: Dashboard ID `9628` (if using PostgreSQL)

Custom metrics to track:
- Request rate: `rate(http_requests_total[5m])`
- Error rate: `rate(http_requests_total{status=~"5.."}[5m])`
- Response time: `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))`
- Active connections: `nodejs_active_handles_total`
- Memory usage: `nodejs_heap_size_used_bytes`

## 🔔 Alerting

### Prometheus Alerting Rules

Create `k8s/monitoring/alerts.yaml`:

```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: jenkinds-alerts
  namespace: jenkinds
spec:
  groups:
    - name: jenkinds
      interval: 30s
      rules:
        # Pod not ready
        - alert: JenKindsPodNotReady
          expr: kube_pod_status_ready{namespace="jenkinds",condition="false"} == 1
          for: 5m
          labels:
            severity: critical
          annotations:
            summary: "JenKinds pod is not ready"
            description: "Pod {{ $labels.pod }} in namespace {{ $labels.namespace }} is not ready for 5 minutes"

        # High memory usage
        - alert: JenKindsHighMemory
          expr: |
            (container_memory_working_set_bytes{namespace="jenkinds",container="jenkinds"} 
            / container_spec_memory_limit_bytes{namespace="jenkinds",container="jenkinds"}) > 0.9
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "JenKinds high memory usage"
            description: "Pod {{ $labels.pod }} is using {{ $value | humanizePercentage }} of memory limit"

        # High CPU usage
        - alert: JenKindsHighCPU
          expr: |
            rate(container_cpu_usage_seconds_total{namespace="jenkinds",container="jenkinds"}[5m]) > 0.8
          for: 10m
          labels:
            severity: warning
          annotations:
            summary: "JenKinds high CPU usage"
            description: "Pod {{ $labels.pod }} CPU usage is above 80%"

        # Pod restart
        - alert: JenKindsPodRestarting
          expr: rate(kube_pod_container_status_restarts_total{namespace="jenkinds"}[15m]) > 0
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "JenKinds pod is restarting"
            description: "Pod {{ $labels.pod }} has restarted {{ $value }} times in the last 15 minutes"

        # Redis down
        - alert: RedisDown
          expr: up{job="redis",namespace="jenkinds"} == 0
          for: 1m
          labels:
            severity: critical
          annotations:
            summary: "Redis is down"
            description: "Redis instance in namespace {{ $labels.namespace }} is down"
```

Apply:
```bash
kubectl apply -f k8s/monitoring/alerts.yaml
```

## 📱 Log Aggregation (Optional)

### Loki for Log Aggregation

```bash
# Add Loki Helm repo
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

# Install Loki
helm install loki grafana/loki-stack \
  --namespace monitoring \
  --set grafana.enabled=false \
  --set promtail.enabled=true
```

### Configure Promtail

Promtail automatically collects logs from all pods.

### Query Logs in Grafana

Add Loki as data source in Grafana:
- URL: `http://loki:3100`

Example LogQL queries:
```logql
# All JenKinds logs
{namespace="jenkinds", app="jenkinds"}

# Error logs only
{namespace="jenkinds", app="jenkinds"} |= "error"

# Rate of error logs
rate({namespace="jenkinds", app="jenkinds"} |= "error" [5m])
```

## 🔎 Distributed Tracing (Optional)

### Jaeger for Tracing

```bash
# Install Jaeger operator
kubectl create namespace observability
kubectl apply -f https://github.com/jaegertracing/jaeger-operator/releases/latest/download/jaeger-operator.yaml -n observability

# Create Jaeger instance
kubectl apply -f - <<EOF
apiVersion: jaegertracing.io/v1
kind: Jaeger
metadata:
  name: jenkinds-jaeger
  namespace: jenkinds
spec:
  strategy: allInOne
  allInOne:
    image: jaegertracing/all-in-one:latest
    options:
      log-level: debug
  storage:
    type: memory
  ingress:
    enabled: false
EOF
```

Access Jaeger UI:
```bash
kubectl port-forward -n jenkinds svc/jenkinds-jaeger-query 16686:16686
```

## 📊 Custom Dashboards

### JenKinds Metrics Dashboard

Key metrics to monitor:

1. **Application Health**
   - Pod count and status
   - Restart count
   - Uptime

2. **Performance**
   - Request rate (req/sec)
   - Response time (p50, p95, p99)
   - Error rate (%)
   - Active connections

3. **Resources**
   - CPU usage (%)
   - Memory usage (MB)
   - Disk usage (GB)
   - Network I/O

4. **Business Metrics**
   - Active users
   - Jenkins builds processed
   - AI analysis requests
   - Cache hit rate

5. **Dependencies**
   - Redis connection status
   - Redis memory usage
   - Database query time
   - External API latency

## 🚨 Incident Response

### Quick Diagnostic Commands

```bash
# Check if pods are running
kubectl get pods -n jenkinds

# Check recent events
kubectl get events -n jenkinds --sort-by='.lastTimestamp' | tail -20

# Check resource usage
kubectl top pods -n jenkinds

# Check logs for errors
kubectl logs -n jenkinds -l app=jenkinds --tail=100 | grep -i error

# Check pod details
kubectl describe pod -n jenkinds -l app=jenkinds

# Check service endpoints
kubectl get endpoints -n jenkinds
```

### Common Issues

1. **Pod CrashLoopBackOff**
   ```bash
   kubectl logs -n jenkinds <pod-name> --previous
   kubectl describe pod -n jenkinds <pod-name>
   ```

2. **High Memory Usage**
   ```bash
   kubectl top pod -n jenkinds
   kubectl exec -n jenkinds <pod-name> -- ps aux
   ```

3. **Database Connection Issues**
   ```bash
   kubectl exec -it -n jenkinds <pod-name> -- sh
   # Inside: check /data/prisma/dev.db exists and has correct permissions
   ```

4. **Redis Connection Issues**
   ```bash
   kubectl get pod -n jenkinds -l app=redis
   kubectl exec -it -n jenkinds <redis-pod> -- redis-cli ping
   ```

## 📚 Best Practices

1. **Set up alerts** for critical metrics (pod down, high resource usage)
2. **Enable log aggregation** for centralized logging
3. **Monitor HPA metrics** to tune scaling thresholds
4. **Set resource requests/limits** appropriately
5. **Use readiness probes** to avoid routing to unhealthy pods
6. **Enable persistent logging** (currently stored in PVC)
7. **Regular log rotation** to prevent disk space issues
8. **Monitor external dependencies** (Jenkins, OpenAI API)
9. **Set up backup alerts** for failed backups
10. **Document runbooks** for common incidents

## 🔧 Useful Scripts

### Health Check Script

```bash
#!/bin/bash
# health-check.sh

NAMESPACE="jenkinds"

echo "Checking JenKinds health..."

# Check pods
PODS=$(kubectl get pods -n $NAMESPACE -l app=jenkinds -o json)
READY=$(echo $PODS | jq -r '.items[0].status.conditions[] | select(.type=="Ready") | .status')

if [ "$READY" = "True" ]; then
  echo "✓ Pods are ready"
else
  echo "✗ Pods are not ready"
  exit 1
fi

# Check service
kubectl get svc jenkinds-service -n $NAMESPACE &> /dev/null
if [ $? -eq 0 ]; then
  echo "✓ Service exists"
else
  echo "✗ Service not found"
  exit 1
fi

# Check health endpoint
POD=$(kubectl get pod -n $NAMESPACE -l app=jenkinds -o jsonpath='{.items[0].metadata.name}')
HEALTH=$(kubectl exec -n $NAMESPACE $POD -- curl -s localhost:9011/health)

if echo $HEALTH | grep -q "ok"; then
  echo "✓ Health endpoint responding"
else
  echo "✗ Health endpoint failed"
  exit 1
fi

echo "All checks passed!"
```

---

**Happy Monitoring! 📊**
