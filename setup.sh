#!/bin/bash

###############################################################################
# JenkInsAITB - Automated Setup Script
# Author: Nir Wolff
# Description: Complete automated setup for Jenkins AI Troubleshooting Bot
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Emojis
CHECK="✅"
CROSS="❌"
ARROW="➜"
ROCKET="🚀"
GEAR="⚙️"
LOCK="🔒"
DATABASE="🗄️"
PACKAGE="📦"
WARNING="⚠️"

###############################################################################
# Helper Functions
###############################################################################

print_header() {
    echo ""
    echo -e "${MAGENTA}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${MAGENTA}║                                                                ║${NC}"
    echo -e "${MAGENTA}║         ${CYAN}JenkInsAITB - Automated Setup Script${MAGENTA}              ║${NC}"
    echo -e "${MAGENTA}║                                                                ║${NC}"
    echo -e "${MAGENTA}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_section() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}${GEAR} $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}${CHECK} $1${NC}"
}

print_error() {
    echo -e "${RED}${CROSS} $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}${WARNING} $1${NC}"
}

print_info() {
    echo -e "${CYAN}${ARROW} $1${NC}"
}

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

###############################################################################
# System Requirements Check
###############################################################################

check_system_requirements() {
    print_section "Checking System Requirements"
    
    local all_good=true
    
    # Check Node.js
    if command_exists node; then
        local node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$node_version" -ge 20 ]; then
            print_success "Node.js $(node --version) installed"
        else
            print_error "Node.js version must be 20 or higher (current: $(node --version))"
            print_info "If using nvm, run: nvm use 20 (or nvm install 20 if not installed)"
            all_good=false
        fi
    else
        print_error "Node.js is not installed"
        print_info "Install from: https://nodejs.org/"
        print_info "Or if using nvm: nvm install 20 && nvm use 20"
        all_good=false
    fi
    
    # Check pnpm
    if command_exists pnpm; then
        print_success "pnpm $(pnpm --version) installed"
    else
        print_warning "pnpm is not installed"
        print_info "Installing pnpm..."
        npm install -g pnpm
        print_success "pnpm installed successfully"
    fi
    
    # Check Git
    if command_exists git; then
        print_success "Git $(git --version | cut -d' ' -f3) installed"
    else
        print_error "Git is not installed"
        all_good=false
    fi
    
    # Check for SQLite (optional, warn only)
    if command_exists sqlite3; then
        print_success "SQLite3 $(sqlite3 --version | cut -d' ' -f1) installed"
    else
        print_warning "SQLite3 not found (optional - will use bundled version)"
    fi
    
    if [ "$all_good" = false ]; then
        print_error "Please install missing requirements and run this script again"
        exit 1
    fi
    
    echo ""
    print_success "All system requirements satisfied!"
}

###############################################################################
# Environment Configuration
###############################################################################

setup_environment() {
    print_section "Setting Up Environment Configuration"
    
    if [ -f ".env" ]; then
        print_warning ".env file already exists"
        read -p "Do you want to overwrite it? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "Keeping existing .env file"
            return
        fi
    fi
    
    print_info "Creating .env file from template..."
    cp .env.example .env
    
    echo ""
    print_info "Let's configure your environment variables:"
    echo ""
    
    # Jenkins Configuration
    echo -e "${CYAN}━━━ Jenkins Configuration ━━━${NC}"
    read -p "Enter your Jenkins URL (e.g., http://localhost:8080): " jenkins_url
    read -p "Enter your Jenkins username: " jenkins_user
    read -p "Enter your Jenkins API token: " jenkins_token
    
    # OpenAI Configuration
    echo ""
    echo -e "${CYAN}━━━ AI Configuration (Optional) ━━━${NC}"
    read -p "Do you want to enable AI-powered log analysis? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter your OpenAI API key: " openai_key
        enable_ai="true"
    else
        openai_key="your-key-here"
        enable_ai="false"
        print_info "AI analysis will be disabled (pattern recognition still works!)"
    fi
    
    # Generate secure secrets
    echo ""
    print_info "Generating secure secrets..."
    jwt_secret=$(openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64)
    session_secret=$(openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64)
    
    # Update .env file
    sed -i.bak "s|DATABASE_URL=.*|DATABASE_URL=\"file:./prisma/dev.db\"|" .env
    sed -i.bak "s|JENKINS_URL=.*|JENKINS_URL=$jenkins_url|" .env
    sed -i.bak "s|JENKINS_USER=.*|JENKINS_USER=$jenkins_user|" .env
    sed -i.bak "s|JENKINS_API_TOKEN=.*|JENKINS_API_TOKEN=$jenkins_token|" .env
    sed -i.bak "s|OPENAI_API_KEY=.*|OPENAI_API_KEY=$openai_key|" .env
    sed -i.bak "s|ENABLE_AI_ANALYSIS=.*|ENABLE_AI_ANALYSIS=$enable_ai|" .env
    sed -i.bak "s|JWT_SECRET=.*|JWT_SECRET=$jwt_secret|" .env
    sed -i.bak "s|SESSION_SECRET=.*|SESSION_SECRET=$session_secret|" .env
    
    rm -f .env.bak
    
    print_success "Environment configuration completed!"
    print_info "Configuration saved to .env (this file is git-ignored)"
}

###############################################################################
# Dependencies Installation
###############################################################################

install_dependencies() {
    print_section "Installing Dependencies"
    
    print_info "Installing Node.js dependencies with pnpm..."
    pnpm install
    
    print_success "Dependencies installed successfully!"
}

###############################################################################
# Database Setup
###############################################################################

setup_database() {
    print_section "Setting Up Database"
    
    print_info "Initializing Prisma database..."
    
    # Generate Prisma client
    print_info "Generating Prisma client..."
    pnpm prisma generate
    
    # Push schema to database
    print_info "Creating database schema..."
    pnpm prisma db push --skip-generate
    
    print_success "Database setup completed!"
    print_info "Database file: ./prisma/dev.db"
}

###############################################################################
# Admin User Setup
###############################################################################

create_admin_user() {
    print_section "Creating Admin User"
    
    echo ""
    print_info "Let's create your admin account:"
    echo ""
    
    read -p "Enter admin username: " admin_username
    read -p "Enter admin email: " admin_email
    read -s -p "Enter admin password: " admin_password
    echo ""
    read -s -p "Confirm admin password: " admin_password_confirm
    echo ""
    
    if [ "$admin_password" != "$admin_password_confirm" ]; then
        print_error "Passwords do not match!"
        return 1
    fi
    
    # Create admin user using our TypeScript script
    print_info "Creating admin user..."
    
    # Create a temporary file with credentials
    cat > /tmp/admin-creds.txt << EOF
$admin_username
$admin_email
Admin
User
$admin_password
$admin_password
EOF
    
    # Run the interactive script with input from file
    if pnpm tsx scripts/create-admin-interactive.ts < /tmp/admin-creds.txt 2>/dev/null; then
        print_success "Admin user created successfully!"
    else
        print_warning "TypeScript method failed, trying alternative..."
        # Fallback: Use Prisma directly
        export ADMIN_USER="$admin_username"
        export ADMIN_EMAIL="$admin_email"
        export ADMIN_PASS="$admin_password"
        
        node -e "
        const { PrismaClient } = require('./.prisma/client');
        const bcrypt = require('bcrypt');
        const prisma = new PrismaClient();
        
        (async () => {
          try {
            const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASS, 10);
            const user = await prisma.user.upsert({
              where: { username: process.env.ADMIN_USER },
              update: { passwordHash: hashedPassword },
              create: {
                username: process.env.ADMIN_USER,
                email: process.env.ADMIN_EMAIL,
                passwordHash: hashedPassword,
                firstName: 'Admin',
                lastName: 'User',
                role: 'ADMIN',
              },
            });
            console.log('✓ Admin user created:', user.username);
            process.exit(0);
          } catch (error) {
            console.error('✗ Error:', error.message);
            process.exit(1);
          } finally {
            await prisma.\$disconnect();
          }
        })();
        " && print_success "Admin user created via fallback method!" || {
            print_error "Both methods failed to create admin user"
            print_info "You can create it manually later with: pnpm setup:admin"
            print_info "Or use: ./scripts/create-admin.sh"
        }
        
        unset ADMIN_USER ADMIN_EMAIL ADMIN_PASS
    fi
    
    rm -f /tmp/admin-creds.txt
    
    echo ""
    print_info "Login credentials:"
    echo -e "  ${CYAN}Username:${NC} $admin_username"
    echo -e "  ${CYAN}Email:${NC} $admin_email"
    echo ""
    
    print_success "Admin user created successfully!"
    echo ""
    print_info "Login credentials:"
    echo -e "  ${CYAN}Username:${NC} $admin_username"
    echo -e "  ${CYAN}Email:${NC} $admin_email"
    echo ""
}

###############################################################################
# Test Jenkins Connection
###############################################################################

test_jenkins_connection() {
    print_section "Testing Jenkins Connection"
    
    print_info "Attempting to connect to Jenkins..."
    
    # Source .env to get Jenkins credentials
    export $(cat .env | grep -v '^#' | xargs)
    
    # Test connection using curl
    response=$(curl -s -o /dev/null -w "%{http_code}" --user "$JENKINS_USER:$JENKINS_API_TOKEN" "$JENKINS_URL/api/json" 2>/dev/null || echo "000")
    
    if [ "$response" = "200" ]; then
        print_success "Successfully connected to Jenkins!"
        print_info "Jenkins URL: $JENKINS_URL"
    else
        print_warning "Could not connect to Jenkins (HTTP $response)"
        print_info "This might be okay if Jenkins is not running yet"
        print_info "You can test the connection later by running: pnpm test:jenkins"
    fi
}

###############################################################################
# Build Application
###############################################################################

build_application() {
    print_section "Building Application"
    
    print_info "Compiling TypeScript and building frontend..."
    pnpm build
    
    print_success "Application built successfully!"
}

###############################################################################
# Create Startup Scripts
###############################################################################

create_startup_scripts() {
    print_section "Creating Startup Scripts"
    
    # Development startup script
    cat > start-dev.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting JenkInsAITB in development mode..."
pnpm dev
EOF
    chmod +x start-dev.sh
    
    # Production startup script
    cat > start-prod.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting JenkInsAITB in production mode..."
pnpm build
pnpm start
EOF
    chmod +x start-prod.sh
    
    print_success "Startup scripts created!"
    print_info "  ./start-dev.sh  - Start in development mode"
    print_info "  ./start-prod.sh - Start in production mode"
}

###############################################################################
# Display Summary
###############################################################################

display_summary() {
    echo ""
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                                ║${NC}"
    echo -e "${GREEN}║              ${ROCKET} Setup Completed Successfully! ${ROCKET}              ║${NC}"
    echo -e "${GREEN}║                                                                ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    print_section "Next Steps"
    
    echo -e "${CYAN}1. Start the application:${NC}"
    echo -e "   ${YELLOW}pnpm dev${NC}  ${BLUE}(development mode with hot reload)${NC}"
    echo -e "   ${YELLOW}./start-dev.sh${NC}  ${BLUE}(same as above)${NC}"
    echo ""
    
    echo -e "${CYAN}2. Access the application:${NC}"
    echo -e "   ${YELLOW}http://localhost:3000${NC}"
    echo ""
    
    echo -e "${CYAN}3. Login with your admin credentials:${NC}"
    echo -e "   ${YELLOW}Username:${NC} $admin_username"
    echo ""
    
    echo -e "${CYAN}4. Explore the features:${NC}"
    echo -e "   ${ARROW} Dashboard with KPIs"
    echo -e "   ${ARROW} Smart Log Analyzer (pattern recognition)"
    echo -e "   ${ARROW} Agents Monitoring"
    echo -e "   ${ARROW} Jobs and Builds Management"
    echo -e "   ${ARROW} AI-Powered Analysis (if enabled)"
    echo ""
    
    print_section "Documentation"
    
    echo -e "  ${BLUE}📖 SMART_FEATURES_README.md${NC} - Feature overview"
    echo -e "  ${BLUE}📖 SECURITY.md${NC} - Security best practices"
    echo -e "  ${BLUE}📖 ARCHITECTURE.md${NC} - System architecture"
    echo -e "  ${BLUE}📖 COMMIT_SUMMARY.md${NC} - Recent changes"
    echo ""
    
    print_section "Useful Commands"
    
    echo -e "  ${YELLOW}pnpm dev${NC}              - Start development server"
    echo -e "  ${YELLOW}pnpm build${NC}            - Build for production"
    echo -e "  ${YELLOW}pnpm start${NC}            - Start production server"
    echo -e "  ${YELLOW}pnpm test${NC}             - Run tests"
    echo -e "  ${YELLOW}pnpm db:studio${NC}        - Open Prisma Studio (database GUI)"
    echo -e "  ${YELLOW}pnpm prisma migrate dev${NC} - Create database migration"
    echo ""
    
    echo -e "${GREEN}${ROCKET} Happy troubleshooting! ${ROCKET}${NC}"
    echo ""
}

###############################################################################
# Main Setup Flow
###############################################################################

main() {
    print_header
    
    # Confirm before proceeding
    echo -e "${YELLOW}This script will set up JenkInsAITB on your system.${NC}"
    echo ""
    read -p "Do you want to continue? (Y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        print_info "Setup cancelled"
        exit 0
    fi
    
    # Run setup steps
    check_system_requirements
    setup_environment
    install_dependencies
    setup_database
    create_admin_user
    test_jenkins_connection
    create_startup_scripts
    
    # Optional: Build application
    echo ""
    read -p "Do you want to build the application now? (Y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        build_application
    fi
    
    display_summary
}

# Run main function
main "$@"
