#!/bin/bash

# 🔥 Firebase/Google Cloud Run Deployment Script for JenKinds
# This script deploys JenKinds to Google Cloud Run with Firebase integration

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID=""
SERVICE_NAME="jenkinds"
REGION="us-central1"
MEMORY="2Gi"
CPU="2"
MIN_INSTANCES="0"
MAX_INSTANCES="10"
TIMEOUT="300s"

echo -e "${BLUE}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                       ║${NC}"
echo -e "${BLUE}║   🔥 JenKinds Firebase/Cloud Run Deployment 🔥       ║${NC}"
echo -e "${BLUE}║                                                       ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""

# Check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}📋 Checking prerequisites...${NC}"
    
    if ! command -v gcloud &> /dev/null; then
        echo -e "${RED}❌ gcloud CLI not found!${NC}"
        echo "Install it from: https://cloud.google.com/sdk/docs/install"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker not found!${NC}"
        echo "Install it from: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Prerequisites satisfied${NC}"
}

# Login to Google Cloud
login_gcloud() {
    echo -e "\n${YELLOW}🔐 Google Cloud Authentication...${NC}"
    
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "@"; then
        echo "No active account found. Logging in..."
        gcloud auth login
    else
        echo -e "${GREEN}✅ Already authenticated${NC}"
    fi
}

# Select or create project
setup_project() {
    echo -e "\n${YELLOW}📦 Setting up Google Cloud Project...${NC}"
    
    echo "Select a project:"
    echo "1. Use existing project"
    echo "2. Create new project"
    read -p "Choice (1 or 2): " project_choice
    
    if [ "$project_choice" = "2" ]; then
        read -p "Enter new project ID (lowercase, no spaces): " PROJECT_ID
        echo "Creating project: $PROJECT_ID"
        gcloud projects create "$PROJECT_ID" --set-as-default
    else
        echo "Available projects:"
        gcloud projects list --format="table(projectId,name)"
        read -p "Enter project ID: " PROJECT_ID
        gcloud config set project "$PROJECT_ID"
    fi
    
    echo -e "${GREEN}✅ Using project: $PROJECT_ID${NC}"
}

# Enable required APIs
enable_apis() {
    echo -e "\n${YELLOW}🔧 Enabling required APIs...${NC}"
    
    apis=(
        "run.googleapis.com"
        "cloudbuild.googleapis.com"
        "secretmanager.googleapis.com"
        "artifactregistry.googleapis.com"
    )
    
    for api in "${apis[@]}"; do
        echo "Enabling $api..."
        gcloud services enable "$api" --project="$PROJECT_ID"
    done
    
    echo -e "${GREEN}✅ APIs enabled${NC}"
}

# Configure secrets
configure_secrets() {
    echo -e "\n${YELLOW}🔐 Configuring secrets...${NC}"
    
    # Jenkins configuration
    read -p "Jenkins URL: " jenkins_url
    read -p "Jenkins Username: " jenkins_user
    read -p "Jenkins API Token: " jenkins_token
    
    # OpenAI configuration
    read -p "OpenAI API Key: " openai_key
    
    # JWT secrets (auto-generate)
    echo "Generating JWT secrets..."
    jwt_secret=$(openssl rand -base64 32)
    refresh_secret=$(openssl rand -base64 32)
    
    # SMTP (optional)
    read -p "Configure SMTP? (y/n): " configure_smtp
    if [ "$configure_smtp" = "y" ]; then
        read -p "SMTP Host: " smtp_host
        read -p "SMTP Port: " smtp_port
        read -p "SMTP User: " smtp_user
        read -p "SMTP Password: " smtp_password
        read -p "SMTP From Email: " smtp_from
    fi
    
    # Store secrets in Secret Manager
    echo "Storing secrets in Google Secret Manager..."
    
    echo -n "$jenkins_url" | gcloud secrets create jenkins-url --data-file=- --project="$PROJECT_ID" 2>/dev/null || \
        echo -n "$jenkins_url" | gcloud secrets versions add jenkins-url --data-file=- --project="$PROJECT_ID"
    
    echo -n "$jenkins_user" | gcloud secrets create jenkins-user --data-file=- --project="$PROJECT_ID" 2>/dev/null || \
        echo -n "$jenkins_user" | gcloud secrets versions add jenkins-user --data-file=- --project="$PROJECT_ID"
    
    echo -n "$jenkins_token" | gcloud secrets create jenkins-api-token --data-file=- --project="$PROJECT_ID" 2>/dev/null || \
        echo -n "$jenkins_token" | gcloud secrets versions add jenkins-api-token --data-file=- --project="$PROJECT_ID"
    
    echo -n "$openai_key" | gcloud secrets create openai-api-key --data-file=- --project="$PROJECT_ID" 2>/dev/null || \
        echo -n "$openai_key" | gcloud secrets versions add openai-api-key --data-file=- --project="$PROJECT_ID"
    
    echo -n "$jwt_secret" | gcloud secrets create jwt-secret --data-file=- --project="$PROJECT_ID" 2>/dev/null || \
        echo -n "$jwt_secret" | gcloud secrets versions add jwt-secret --data-file=- --project="$PROJECT_ID"
    
    echo -n "$refresh_secret" | gcloud secrets create refresh-token-secret --data-file=- --project="$PROJECT_ID" 2>/dev/null || \
        echo -n "$refresh_secret" | gcloud secrets versions add refresh-token-secret --data-file=- --project="$PROJECT_ID"
    
    if [ "$configure_smtp" = "y" ]; then
        echo -n "$smtp_host" | gcloud secrets create smtp-host --data-file=- --project="$PROJECT_ID" 2>/dev/null || \
            echo -n "$smtp_host" | gcloud secrets versions add smtp-host --data-file=- --project="$PROJECT_ID"
        
        echo -n "$smtp_port" | gcloud secrets create smtp-port --data-file=- --project="$PROJECT_ID" 2>/dev/null || \
            echo -n "$smtp_port" | gcloud secrets versions add smtp-port --data-file=- --project="$PROJECT_ID"
        
        echo -n "$smtp_user" | gcloud secrets create smtp-user --data-file=- --project="$PROJECT_ID" 2>/dev/null || \
            echo -n "$smtp_user" | gcloud secrets versions add smtp-user --data-file=- --project="$PROJECT_ID"
        
        echo -n "$smtp_password" | gcloud secrets create smtp-password --data-file=- --project="$PROJECT_ID" 2>/dev/null || \
            echo -n "$smtp_password" | gcloud secrets versions add smtp-password --data-file=- --project="$PROJECT_ID"
        
        echo -n "$smtp_from" | gcloud secrets create smtp-from --data-file=- --project="$PROJECT_ID" 2>/dev/null || \
            echo -n "$smtp_from" | gcloud secrets versions add smtp-from --data-file=- --project="$PROJECT_ID"
    fi
    
    echo -e "${GREEN}✅ Secrets configured${NC}"
}

# Build and deploy
deploy_to_cloud_run() {
    echo -e "\n${YELLOW}🚀 Deploying to Cloud Run...${NC}"
    
    # Get script directory
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
    
    cd "$PROJECT_ROOT"
    
    echo "Building and deploying from: $PROJECT_ROOT"
    
    # Build using Cloud Build and deploy
    echo "Building Docker image with Cloud Build..."
    IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"
    
    gcloud builds submit --tag "$IMAGE_NAME" --project "$PROJECT_ID" --file Dockerfile.cloudrun .
    
    # Deploy command with secrets
    build_cmd="gcloud run deploy $SERVICE_NAME \
        --image $IMAGE_NAME \
        --platform managed \
        --region $REGION \
        --memory $MEMORY \
        --cpu $CPU \
        --min-instances $MIN_INSTANCES \
        --max-instances $MAX_INSTANCES \
        --timeout $TIMEOUT \
        --allow-unauthenticated \
        --project $PROJECT_ID \
        --set-env-vars NODE_ENV=production,PORT=8080 \
        --set-secrets JENKINS_URL=jenkins-url:latest,JENKINS_USER=jenkins-user:latest,JENKINS_API_TOKEN=jenkins-api-token:latest,OPENAI_API_KEY=openai-api-key:latest,JWT_SECRET=jwt-secret:latest,REFRESH_TOKEN_SECRET=refresh-token-secret:latest"
    
    # Add SMTP secrets if configured
    if [ "$configure_smtp" = "y" ]; then
        build_cmd="$build_cmd,SMTP_HOST=smtp-host:latest,SMTP_PORT=smtp-port:latest,SMTP_USER=smtp-user:latest,SMTP_PASSWORD=smtp-password:latest,SMTP_FROM=smtp-from:latest"
    fi
    
    echo "Executing deployment..."
    eval "$build_cmd"
    
    echo -e "${GREEN}✅ Deployed to Cloud Run${NC}"
}

# Get service URL
get_service_url() {
    echo -e "\n${YELLOW}🌐 Getting service URL...${NC}"
    
    SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
        --region "$REGION" \
        --project "$PROJECT_ID" \
        --format "value(status.url)")
    
    echo -e "${GREEN}✅ Service URL: $SERVICE_URL${NC}"
}

# Display summary
show_summary() {
    echo -e "\n${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                       ║${NC}"
    echo -e "${GREEN}║           🎉 Deployment Successful! 🎉                ║${NC}"
    echo -e "${GREEN}║                                                       ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BLUE}📊 Deployment Information:${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "Project ID:    ${YELLOW}$PROJECT_ID${NC}"
    echo -e "Service Name:  ${YELLOW}$SERVICE_NAME${NC}"
    echo -e "Region:        ${YELLOW}$REGION${NC}"
    echo -e "Service URL:   ${GREEN}$SERVICE_URL${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo -e "${BLUE}🔗 Quick Links:${NC}"
    echo -e "Application:   ${GREEN}$SERVICE_URL${NC}"
    echo -e "Logs:          ${BLUE}https://console.cloud.google.com/run/detail/$REGION/$SERVICE_NAME/logs?project=$PROJECT_ID${NC}"
    echo -e "Metrics:       ${BLUE}https://console.cloud.google.com/run/detail/$REGION/$SERVICE_NAME/metrics?project=$PROJECT_ID${NC}"
    echo -e "Console:       ${BLUE}https://console.cloud.google.com/run?project=$PROJECT_ID${NC}"
    echo ""
    echo -e "${BLUE}📋 Useful Commands:${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "View logs:"
    echo "  gcloud run logs tail $SERVICE_NAME --region $REGION --project $PROJECT_ID"
    echo ""
    echo "Update service:"
    echo "  gcloud run deploy $SERVICE_NAME --source . --region $REGION --project $PROJECT_ID"
    echo ""
    echo "Delete service:"
    echo "  gcloud run services delete $SERVICE_NAME --region $REGION --project $PROJECT_ID"
    echo ""
    echo "View secrets:"
    echo "  gcloud secrets list --project $PROJECT_ID"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo -e "${GREEN}✅ Your JenKinds instance is now live!${NC}"
    echo ""
}

# Main execution
main() {
    check_prerequisites
    login_gcloud
    setup_project
    enable_apis
    configure_secrets
    deploy_to_cloud_run
    get_service_url
    show_summary
}

# Run main function
main
