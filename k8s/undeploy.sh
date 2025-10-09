#!/bin/bash

###############################################################################
# JenKinds - Undeploy from k3s
# Remove all Kubernetes resources
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

NAMESPACE="jenkinds"

log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         JenKinds k3s Undeploy Script                       ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

log_warning "This will remove all JenKinds resources from your cluster!"
log_warning "PersistentVolumeClaims will be preserved by default to protect your data."
echo ""
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_info "Undeploy cancelled"
    exit 0
fi

# Remove resources in reverse order
log_info "Removing Ingress..."
kubectl delete -f k8s/ingress.yaml --ignore-not-found=true

log_info "Removing HPA..."
kubectl delete -f k8s/hpa.yaml --ignore-not-found=true

log_info "Removing JenKinds deployment..."
kubectl delete -f k8s/deployment.yaml --ignore-not-found=true

log_info "Removing Redis..."
kubectl delete -f k8s/redis.yaml --ignore-not-found=true

# Ask about PVCs
echo ""
read -p "Do you want to delete PersistentVolumeClaims (this will DELETE your data)? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_warning "Deleting PVCs and all data..."
    kubectl delete -f k8s/pvc.yaml
else
    log_info "Keeping PVCs and data"
fi

log_info "Removing Secrets..."
kubectl delete -f k8s/secrets.yaml --ignore-not-found=true

log_info "Removing ConfigMap..."
kubectl delete -f k8s/configmap.yaml --ignore-not-found=true

log_info "Removing RBAC..."
kubectl delete -f k8s/rbac.yaml --ignore-not-found=true

# Ask about namespace
echo ""
read -p "Do you want to delete the namespace (this will force delete everything)? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_warning "Deleting namespace..."
    kubectl delete -f k8s/namespace.yaml
else
    log_info "Keeping namespace"
fi

echo ""
log_success "Undeploy complete!"
echo ""
log_info "If you kept PVCs, your data is preserved for future deployments"
