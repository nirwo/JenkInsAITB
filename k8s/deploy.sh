#!/bin/bash

###############################################################################
# JenKinds - Build and Deploy to k3s
# Complete deployment script for Kubernetes
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         JenKinds k3s Deployment Script                     ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Determine script location and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Configuration
NAMESPACE="jenkinds"
IMAGE_NAME="jenkinds"
IMAGE_TAG="${IMAGE_TAG:-latest}"
REGISTRY="${REGISTRY:-}"  # Leave empty for local, or set to your registry
DOCKERFILE="${PROJECT_ROOT}/Dockerfile.k8s"
K8S_DIR="${PROJECT_ROOT}/k8s"

# Functions
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

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed"
        echo "Install with: curl -LO https://dl.k8s.io/release/\$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    # Check if Dockerfile exists
    if [ ! -f "${DOCKERFILE}" ]; then
        log_error "Dockerfile not found at: ${DOCKERFILE}"
        echo "Make sure you're running this script from the k8s/ directory"
        exit 1
    fi
    
    # Check if k8s manifests exist
    if [ ! -d "${K8S_DIR}" ]; then
        log_error "k8s directory not found at: ${K8S_DIR}"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
    log_info "Project root: ${PROJECT_ROOT}"
    log_info "Dockerfile: ${DOCKERFILE}"
}

# Build Docker image
build_image() {
    log_info "Building Docker image..."
    
    if [ -n "$REGISTRY" ]; then
        FULL_IMAGE="${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
    else
        FULL_IMAGE="${IMAGE_NAME}:${IMAGE_TAG}"
    fi
    
    log_info "Building ${FULL_IMAGE}..."
    log_info "Build context: ${PROJECT_ROOT}"
    
    # Build from project root with correct context
    docker build -t "${FULL_IMAGE}" -f "${DOCKERFILE}" "${PROJECT_ROOT}"
    
    log_success "Image built: ${FULL_IMAGE}"
    
    # If using k3s, import image directly
    if command -v k3s &> /dev/null && [ -z "$REGISTRY" ]; then
        log_info "Importing image to k3s..."
        docker save "${FULL_IMAGE}" | sudo k3s ctr images import -
        log_success "Image imported to k3s"
    fi
    
    # If registry is set, push image
    if [ -n "$REGISTRY" ]; then
        log_info "Pushing image to registry..."
        docker push "${FULL_IMAGE}"
        log_success "Image pushed to registry"
    fi
}

# Update secrets
update_secrets() {
    log_warning "Please update ${K8S_DIR}/secrets.yaml with your credentials before deployment!"
    log_info "See ${K8S_DIR}/SECRETS_GUIDE.md for detailed instructions"
    read -p "Have you updated secrets.yaml? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_error "Please update secrets.yaml and run again"
        log_info "Edit: ${K8S_DIR}/secrets.yaml"
        exit 1
    fi
}

# Deploy to k8s
deploy() {
    log_info "Deploying to Kubernetes..."
    
    # Create namespace
    log_info "Creating namespace..."
    kubectl apply -f "${K8S_DIR}/namespace.yaml"
    
    # Apply RBAC
    log_info "Applying RBAC..."
    kubectl apply -f "${K8S_DIR}/rbac.yaml"
    
    # Apply ConfigMap
    log_info "Applying ConfigMap..."
    kubectl apply -f "${K8S_DIR}/configmap.yaml"
    
    # Apply Secrets
    log_info "Applying Secrets..."
    kubectl apply -f "${K8S_DIR}/secrets.yaml"
    
    # Apply PVCs
    log_info "Creating Persistent Volumes..."
    kubectl apply -f "${K8S_DIR}/pvc.yaml"
    
    # Deploy Redis
    log_info "Deploying Redis..."
    kubectl apply -f "${K8S_DIR}/redis.yaml"
    
    # Wait for Redis to be ready
    log_info "Waiting for Redis to be ready..."
    kubectl wait --for=condition=ready pod -l app=redis -n ${NAMESPACE} --timeout=120s
    
    # Deploy JenKinds
    log_info "Deploying JenKinds application..."
    kubectl apply -f "${K8S_DIR}/deployment.yaml"
    
    # Wait for deployment
    log_info "Waiting for JenKinds to be ready..."
    kubectl wait --for=condition=available deployment/jenkinds -n ${NAMESPACE} --timeout=180s
    
    # Apply HPA (optional)
    log_info "Applying Horizontal Pod Autoscaler..."
    kubectl apply -f "${K8S_DIR}/hpa.yaml"
    
    # Apply Ingress (optional)
    if [ -f "${K8S_DIR}/ingress.yaml" ]; then
        read -p "Do you want to apply Ingress? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log_warning "Make sure to update the host in k8s/ingress.yaml!"
            kubectl apply -f "${K8S_DIR}/ingress.yaml"
            log_success "Ingress applied"
        fi
    fi
    
    log_success "Deployment complete!"
}

# Show status
show_status() {
    echo ""
    log_info "Deployment Status:"
    echo ""
    
    kubectl get all -n ${NAMESPACE}
    
    echo ""
    log_info "Access Information:"
    echo ""
    
    # Get service info
    SERVICE_TYPE=$(kubectl get svc jenkinds-service -n ${NAMESPACE} -o jsonpath='{.spec.type}')
    
    if [ "$SERVICE_TYPE" = "LoadBalancer" ]; then
        EXTERNAL_IP=$(kubectl get svc jenkinds-service -n ${NAMESPACE} -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
        if [ -n "$EXTERNAL_IP" ]; then
            echo -e "${GREEN}✓${NC} External URL: http://${EXTERNAL_IP}:9011"
        else
            log_warning "LoadBalancer external IP pending..."
        fi
    elif [ "$SERVICE_TYPE" = "NodePort" ]; then
        NODE_PORT=$(kubectl get svc jenkinds-service -n ${NAMESPACE} -o jsonpath='{.spec.ports[0].nodePort}')
        NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')
        echo -e "${GREEN}✓${NC} Access via NodePort: http://${NODE_IP}:${NODE_PORT}"
    else
        echo -e "${YELLOW}⚠${NC} Service type is ClusterIP. Use port-forward to access:"
        echo "   kubectl port-forward -n ${NAMESPACE} svc/jenkinds-service 9011:9011"
        echo "   Then access: http://localhost:9011"
    fi
    
    # Check for Ingress
    if kubectl get ingress jenkinds-ingress -n ${NAMESPACE} &> /dev/null; then
        INGRESS_HOST=$(kubectl get ingress jenkinds-ingress -n ${NAMESPACE} -o jsonpath='{.spec.rules[0].host}')
        echo -e "${GREEN}✓${NC} Ingress URL: https://${INGRESS_HOST}"
    fi
}

# Create admin user
create_admin() {
    echo ""
    read -p "Do you want to create an admin user? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Creating admin user..."
        POD=$(kubectl get pod -n ${NAMESPACE} -l app=jenkinds -o jsonpath='{.items[0].metadata.name}')
        kubectl exec -it -n ${NAMESPACE} ${POD} -- node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Username: ', (username) => {
  rl.question('Email: ', (email) => {
    rl.question('Password: ', async (password) => {
      const prisma = new PrismaClient();
      try {
        const passwordHash = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
          data: {
            username,
            email,
            passwordHash,
            role: 'ADMIN'
          }
        });
        console.log('\n✓ Admin user created:', user.email);
      } catch (error) {
        console.error('Error:', error.message);
      } finally {
        await prisma.\$disconnect();
        rl.close();
      }
    });
  });
});
"
    fi
}

# Main execution
main() {
    check_prerequisites
    
    echo ""
    log_info "Deployment Options:"
    echo "1. Build and deploy"
    echo "2. Build only"
    echo "3. Deploy only (use existing image)"
    echo "4. Show status"
    echo ""
    read -p "Select option (1-4): " -n 1 -r
    echo ""
    
    case $REPLY in
        1)
            build_image
            update_secrets
            deploy
            show_status
            create_admin
            ;;
        2)
            build_image
            ;;
        3)
            update_secrets
            deploy
            show_status
            create_admin
            ;;
        4)
            show_status
            ;;
        *)
            log_error "Invalid option"
            exit 1
            ;;
    esac
    
    echo ""
    log_success "All done! 🎉"
    echo ""
    log_info "Useful commands:"
    echo "  kubectl get all -n ${NAMESPACE}"
    echo "  kubectl logs -f -n ${NAMESPACE} -l app=jenkinds"
    echo "  kubectl exec -it -n ${NAMESPACE} <pod-name> -- sh"
    echo "  kubectl port-forward -n ${NAMESPACE} svc/jenkinds-service 9011:9011"
    echo ""
}

main
