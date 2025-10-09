#!/bin/bash

###############################################################################
# JenKinds k3s - One-Command Initialization Script
# Works on: Ubuntu 20.04+, Debian 11+, Other Linux distros
# Usage: curl -fsSL https://raw.githubusercontent.com/nirwo/JenkInsAITB/master/k8s/init-k8s.sh | bash
#        OR: ./init-k8s.sh
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
K3S_VERSION="${K3S_VERSION:-v1.28.3+k3s1}"
KUBECTL_VERSION="${KUBECTL_VERSION:-v1.28.3}"
PROJECT_NAME="JenKinds"
NAMESPACE="jenkinds"

# Detect OS
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        OS_VERSION=$VERSION_ID
    else
        echo -e "${RED}Cannot detect OS. /etc/os-release not found${NC}"
        exit 1
    fi
}

log_section() {
    echo ""
    echo -e "${MAGENTA}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${MAGENTA}║ $1${NC}"
    echo -e "${MAGENTA}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

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

log_step() {
    echo -e "${CYAN}→${NC} $1"
}

# Check if running as root
check_root() {
    if [ "$EUID" -eq 0 ]; then
        log_warning "Running as root. This is OK for server setup."
        IS_ROOT=true
    else
        IS_ROOT=false
        log_info "Running as non-root user. Will use sudo when needed."
    fi
}

# Install system dependencies
install_dependencies() {
    log_section "Installing System Dependencies"
    
    detect_os
    log_info "Detected OS: $OS $OS_VERSION"
    
    case $OS in
        ubuntu|debian)
            log_step "Updating package list..."
            sudo apt-get update -qq
            
            log_step "Installing required packages..."
            sudo apt-get install -y -qq \
                curl \
                wget \
                git \
                ca-certificates \
                gnupg \
                lsb-release \
                apt-transport-https \
                software-properties-common \
                jq \
                > /dev/null 2>&1
            ;;
        centos|rhel|fedora)
            log_step "Installing required packages..."
            sudo yum install -y curl wget git ca-certificates jq > /dev/null 2>&1
            ;;
        *)
            log_warning "Unknown OS: $OS. Proceeding with caution..."
            ;;
    esac
    
    log_success "System dependencies installed"
}

# Install Docker
install_docker() {
    log_section "Installing Docker"
    
    if command -v docker &> /dev/null; then
        log_success "Docker already installed: $(docker --version)"
        return
    fi
    
    log_step "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh > /dev/null 2>&1
    rm get-docker.sh
    
    # Add current user to docker group
    if [ "$IS_ROOT" = false ]; then
        sudo usermod -aG docker $USER
        log_warning "Added $USER to docker group. You may need to logout/login for this to take effect."
        log_warning "For now, commands will use sudo."
    fi
    
    # Start Docker
    sudo systemctl enable docker > /dev/null 2>&1
    sudo systemctl start docker
    
    log_success "Docker installed: $(docker --version)"
}

# Install k3s
install_k3s() {
    log_section "Installing k3s"
    
    if command -v k3s &> /dev/null; then
        log_success "k3s already installed: $(k3s --version | head -n1)"
        return
    fi
    
    log_step "Installing k3s ${K3S_VERSION}..."
    curl -sfL https://get.k3s.io | INSTALL_K3S_VERSION="${K3S_VERSION}" sh - > /dev/null 2>&1
    
    # Wait for k3s to be ready
    log_step "Waiting for k3s to be ready..."
    for i in {1..30}; do
        if sudo k3s kubectl get nodes &> /dev/null; then
            break
        fi
        sleep 2
    done
    
    log_success "k3s installed and running"
}

# Configure kubectl
setup_kubectl() {
    log_section "Configuring kubectl"
    
    # Install kubectl if not present
    if ! command -v kubectl &> /dev/null; then
        log_step "Installing kubectl..."
        curl -LO "https://dl.k8s.io/release/${KUBECTL_VERSION}/bin/linux/amd64/kubectl" > /dev/null 2>&1
        chmod +x kubectl
        sudo mv kubectl /usr/local/bin/
    fi
    
    # Setup kubeconfig
    log_step "Setting up kubeconfig..."
    mkdir -p $HOME/.kube
    sudo cp /etc/rancher/k3s/k3s.yaml $HOME/.kube/config
    sudo chown $USER:$USER $HOME/.kube/config
    chmod 600 $HOME/.kube/config
    
    # Test kubectl
    if kubectl get nodes &> /dev/null; then
        log_success "kubectl configured successfully"
        kubectl get nodes
    else
        log_error "kubectl configuration failed"
        exit 1
    fi
}

# Install Node.js and pnpm
install_nodejs() {
    log_section "Installing Node.js and pnpm"
    
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        log_success "Node.js already installed: $NODE_VERSION"
        
        # Check if version is acceptable (v18+)
        NODE_MAJOR=$(echo $NODE_VERSION | cut -d. -f1 | sed 's/v//')
        if [ "$NODE_MAJOR" -lt 18 ]; then
            log_warning "Node.js version is too old. Installing Node.js 20..."
        else
            # Check pnpm
            if command -v pnpm &> /dev/null; then
                log_success "pnpm already installed: $(pnpm --version)"
                return
            fi
        fi
    fi
    
    log_step "Installing Node.js 20 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - > /dev/null 2>&1
    sudo apt-get install -y nodejs > /dev/null 2>&1
    
    log_step "Installing pnpm..."
    sudo npm install -g pnpm@latest > /dev/null 2>&1
    
    log_success "Node.js installed: $(node --version)"
    log_success "pnpm installed: $(pnpm --version)"
}

# Clone or update repository
setup_repository() {
    log_section "Setting up Repository"
    
    if [ -d "$HOME/$PROJECT_NAME" ]; then
        log_warning "Directory $HOME/$PROJECT_NAME already exists"
        read -p "Do you want to update it? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log_step "Updating repository..."
            cd "$HOME/$PROJECT_NAME"
            git pull origin master
            log_success "Repository updated"
        else
            log_info "Using existing repository"
        fi
        cd "$HOME/$PROJECT_NAME"
    else
        log_step "Cloning repository..."
        cd $HOME
        git clone https://github.com/nirwo/JenkInsAITB.git $PROJECT_NAME
        cd $PROJECT_NAME
        log_success "Repository cloned"
    fi
    
    # Store project path
    PROJECT_PATH="$HOME/$PROJECT_NAME"
    export PROJECT_PATH
}

# Interactive secrets configuration
configure_secrets() {
    log_section "Configuring Secrets"
    
    SECRETS_FILE="$PROJECT_PATH/k8s/secrets.yaml"
    SECRETS_TEMPLATE="$PROJECT_PATH/k8s/secrets.yaml.template"
    
    log_info "We need to configure your credentials."
    log_info "You can skip this now and edit k8s/secrets.yaml manually later."
    echo ""
    
    read -p "Do you want to configure secrets now? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_warning "Skipping secrets configuration. Remember to update k8s/secrets.yaml before deploying!"
        return
    fi
    
    # Create backup of original
    cp "$SECRETS_FILE" "$SECRETS_FILE.backup"
    
    echo ""
    log_info "Enter your credentials (press Enter to skip):"
    echo ""
    
    # Jenkins Configuration
    echo -e "${CYAN}Jenkins Configuration:${NC}"
    read -p "Jenkins URL (e.g., https://jenkins.example.com): " JENKINS_URL
    read -p "Jenkins Username: " JENKINS_USER
    read -p "Jenkins API Token: " JENKINS_TOKEN
    
    # OpenAI
    echo ""
    echo -e "${CYAN}OpenAI Configuration:${NC}"
    read -p "OpenAI API Key (starts with sk-): " OPENAI_KEY
    
    # JWT Secrets
    echo ""
    echo -e "${CYAN}Generating JWT Secrets...${NC}"
    JWT_SECRET=$(openssl rand -base64 32)
    REFRESH_SECRET=$(openssl rand -base64 32)
    log_success "JWT secrets generated"
    
    # SMTP (optional)
    echo ""
    echo -e "${CYAN}SMTP Configuration (optional, press Enter to skip):${NC}"
    read -p "SMTP Host (e.g., smtp.gmail.com): " SMTP_HOST
    if [ -n "$SMTP_HOST" ]; then
        read -p "SMTP Port (e.g., 587): " SMTP_PORT
        read -p "SMTP User: " SMTP_USER
        read -p "SMTP Password: " SMTP_PASS
        read -p "SMTP From Email: " SMTP_FROM
    fi
    
    # Update secrets file
    log_step "Updating secrets file..."
    
    # Use sed to replace values (works on both Linux and macOS)
    if [ -n "$JENKINS_URL" ]; then
        sed -i.bak "s|JENKINS_URL:.*|JENKINS_URL: \"$JENKINS_URL\"|" "$SECRETS_FILE"
    fi
    if [ -n "$JENKINS_USER" ]; then
        sed -i.bak "s|JENKINS_USER:.*|JENKINS_USER: \"$JENKINS_USER\"|" "$SECRETS_FILE"
    fi
    if [ -n "$JENKINS_TOKEN" ]; then
        sed -i.bak "s|JENKINS_API_TOKEN:.*|JENKINS_API_TOKEN: \"$JENKINS_TOKEN\"|" "$SECRETS_FILE"
    fi
    if [ -n "$OPENAI_KEY" ]; then
        sed -i.bak "s|OPENAI_API_KEY:.*|OPENAI_API_KEY: \"$OPENAI_KEY\"|" "$SECRETS_FILE"
    fi
    sed -i.bak "s|JWT_SECRET:.*|JWT_SECRET: \"$JWT_SECRET\"|" "$SECRETS_FILE"
    sed -i.bak "s|REFRESH_TOKEN_SECRET:.*|REFRESH_TOKEN_SECRET: \"$REFRESH_SECRET\"|" "$SECRETS_FILE"
    
    if [ -n "$SMTP_HOST" ]; then
        sed -i.bak "s|SMTP_HOST:.*|SMTP_HOST: \"$SMTP_HOST\"|" "$SECRETS_FILE"
        sed -i.bak "s|SMTP_PORT:.*|SMTP_PORT: \"$SMTP_PORT\"|" "$SECRETS_FILE"
        sed -i.bak "s|SMTP_USER:.*|SMTP_USER: \"$SMTP_USER\"|" "$SECRETS_FILE"
        sed -i.bak "s|SMTP_PASSWORD:.*|SMTP_PASSWORD: \"$SMTP_PASS\"|" "$SECRETS_FILE"
        if [ -n "$SMTP_FROM" ]; then
            sed -i.bak "s|SMTP_FROM:.*|SMTP_FROM: \"$SMTP_FROM\"|" "$SECRETS_FILE"
        fi
    fi
    
    # Remove backup files
    rm -f "$SECRETS_FILE.bak"
    
    log_success "Secrets configured"
    log_info "Backup saved to: $SECRETS_FILE.backup"
}

# Build Docker image
build_image() {
    log_section "Building Docker Image"
    
    cd "$PROJECT_PATH"
    
    log_step "Building jenkinds:latest..."
    log_info "This may take 5-10 minutes depending on your system..."
    
    # Build with progress
    if $IS_ROOT; then
        docker build -t jenkinds:latest -f Dockerfile.k8s . 
    else
        sudo docker build -t jenkinds:latest -f Dockerfile.k8s .
    fi
    
    log_success "Docker image built successfully"
    
    # Import to k3s
    log_step "Importing image to k3s..."
    if $IS_ROOT; then
        docker save jenkinds:latest | k3s ctr images import -
    else
        sudo docker save jenkinds:latest | sudo k3s ctr images import -
    fi
    
    log_success "Image imported to k3s"
}

# Deploy to k3s
deploy_to_k3s() {
    log_section "Deploying to k3s"
    
    cd "$PROJECT_PATH/k8s"
    
    log_step "Creating namespace..."
    kubectl apply -f namespace.yaml
    
    log_step "Applying RBAC..."
    kubectl apply -f rbac.yaml
    
    log_step "Applying ConfigMap..."
    kubectl apply -f configmap.yaml
    
    log_step "Applying Secrets..."
    kubectl apply -f secrets.yaml
    
    log_step "Creating PersistentVolumeClaims..."
    kubectl apply -f pvc.yaml
    
    log_step "Deploying Redis..."
    kubectl apply -f redis.yaml
    
    log_step "Waiting for Redis to be ready..."
    kubectl wait --for=condition=ready pod -l app=redis -n $NAMESPACE --timeout=120s
    
    log_step "Deploying JenKinds application..."
    kubectl apply -f deployment.yaml
    
    log_step "Waiting for JenKinds to be ready..."
    kubectl wait --for=condition=available deployment/jenkinds -n $NAMESPACE --timeout=300s
    
    log_step "Applying HPA..."
    kubectl apply -f hpa.yaml
    
    log_success "Deployment complete!"
}

# Show access information
show_access_info() {
    log_section "Access Information"
    
    echo ""
    log_success "JenKinds is now running!"
    echo ""
    
    # Get pod status
    log_info "Pod Status:"
    kubectl get pods -n $NAMESPACE
    
    echo ""
    log_info "To access JenKinds:"
    echo ""
    echo -e "${CYAN}Option 1: Port Forward (Easiest)${NC}"
    echo "  kubectl port-forward -n $NAMESPACE svc/jenkinds-service 9011:9011"
    echo "  Then open: http://localhost:9011"
    echo ""
    
    # Check if we can get node IP
    NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')
    if [ -n "$NODE_IP" ]; then
        echo -e "${CYAN}Option 2: NodePort (from any machine)${NC}"
        echo "  First, edit k8s/deployment.yaml and change service type to NodePort"
        echo "  Then access: http://$NODE_IP:30911"
        echo ""
    fi
    
    echo -e "${CYAN}Option 3: Ingress (Production)${NC}"
    echo "  1. Update k8s/ingress.yaml with your domain"
    echo "  2. Apply: kubectl apply -f k8s/ingress.yaml"
    echo "  3. Configure DNS to point to this server"
    echo ""
    
    log_info "Useful Commands:"
    echo "  View logs:      kubectl logs -f -n $NAMESPACE -l app=jenkinds"
    echo "  Shell access:   kubectl exec -it -n $NAMESPACE <pod-name> -- sh"
    echo "  Restart:        kubectl rollout restart deployment/jenkinds -n $NAMESPACE"
    echo "  Status:         kubectl get all -n $NAMESPACE"
    echo ""
    
    log_info "Documentation:"
    echo "  Full guide:     $PROJECT_PATH/K8S_DEPLOYMENT.md"
    echo "  Quick ref:      $PROJECT_PATH/k8s/README.md"
    echo "  Secrets:        $PROJECT_PATH/k8s/SECRETS_GUIDE.md"
    echo ""
}

# Create admin user
create_admin_user() {
    log_section "Creating Admin User"
    
    read -p "Do you want to create an admin user now? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Skipped. You can create one later with:"
        echo "  kubectl exec -it -n $NAMESPACE <pod-name> -- node dist/scripts/create-admin.js"
        return
    fi
    
    # Get pod name
    POD=$(kubectl get pod -n $NAMESPACE -l app=jenkinds -o jsonpath='{.items[0].metadata.name}')
    
    if [ -z "$POD" ]; then
        log_error "No pods found. Cannot create admin user."
        return
    fi
    
    log_info "Creating admin user in pod: $POD"
    
    # Interactive admin creation
    read -p "Username: " ADMIN_USER
    read -p "Email: " ADMIN_EMAIL
    read -s -p "Password: " ADMIN_PASS
    echo ""
    
    kubectl exec -it -n $NAMESPACE $POD -- node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

(async () => {
  const prisma = new PrismaClient();
  try {
    const passwordHash = await bcrypt.hash('$ADMIN_PASS', 10);
    const user = await prisma.user.create({
      data: {
        username: '$ADMIN_USER',
        email: '$ADMIN_EMAIL',
        passwordHash,
        role: 'ADMIN'
      }
    });
    console.log('✓ Admin user created:', user.email);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.\$disconnect();
  }
})();
"
    
    log_success "Admin user created!"
}

# Save installation info
save_install_info() {
    INSTALL_INFO="$HOME/.jenkinds-install-info"
    cat > "$INSTALL_INFO" <<EOF
# JenKinds Installation Information
# Generated: $(date)

PROJECT_PATH=$PROJECT_PATH
NAMESPACE=$NAMESPACE
K3S_VERSION=$K3S_VERSION
NODE_VERSION=$(node --version)
KUBECTL_VERSION=$(kubectl version --client -o json | jq -r .clientVersion.gitVersion)

# Quick Commands
alias jenkinds-logs='kubectl logs -f -n $NAMESPACE -l app=jenkinds'
alias jenkinds-status='kubectl get all -n $NAMESPACE'
alias jenkinds-shell='kubectl exec -it -n $NAMESPACE \$(kubectl get pod -n $NAMESPACE -l app=jenkinds -o jsonpath="{.items[0].metadata.name}") -- sh'
alias jenkinds-restart='kubectl rollout restart deployment/jenkinds -n $NAMESPACE'
alias jenkinds-forward='kubectl port-forward -n $NAMESPACE svc/jenkinds-service 9011:9011'

# Add to your ~/.bashrc or ~/.zshrc:
# source $INSTALL_INFO
EOF
    
    log_success "Installation info saved to: $INSTALL_INFO"
    log_info "Add to your shell: echo 'source $INSTALL_INFO' >> ~/.bashrc"
}

# Main installation flow
main() {
    clear
    echo -e "${MAGENTA}"
    cat << "EOF"
    ╔══════════════════════════════════════════════════════════╗
    ║                                                          ║
    ║              JenKinds k3s Initializer                    ║
    ║          One-Command Kubernetes Setup                    ║
    ║                                                          ║
    ║  This will install and configure:                        ║
    ║  • Docker                                                ║
    ║  • k3s Kubernetes                                        ║
    ║  • kubectl                                               ║
    ║  • Node.js 20 + pnpm                                     ║
    ║  • JenKinds application                                  ║
    ║                                                          ║
    ╚══════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
    
    log_warning "This script will install software and modify system configuration."
    log_warning "It requires sudo access for some operations."
    echo ""
    read -p "Do you want to continue? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Installation cancelled"
        exit 0
    fi
    
    # Run installation steps
    check_root
    install_dependencies
    install_docker
    install_k3s
    setup_kubectl
    install_nodejs
    setup_repository
    configure_secrets
    build_image
    deploy_to_k3s
    show_access_info
    create_admin_user
    save_install_info
    
    # Final message
    echo ""
    log_section "Installation Complete!"
    echo ""
    log_success "JenKinds is now running on your k3s cluster!"
    log_success "Access it with: kubectl port-forward -n $NAMESPACE svc/jenkinds-service 9011:9011"
    echo ""
    log_info "Documentation: $PROJECT_PATH/K8S_DEPLOYMENT.md"
    log_info "Support: https://github.com/nirwo/JenkInsAITB/issues"
    echo ""
    echo -e "${MAGENTA}Happy monitoring! 🎉${NC}"
    echo ""
}

# Run main function
main "$@"
