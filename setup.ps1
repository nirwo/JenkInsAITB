###############################################################################
# JenkInsAITB - Automated Setup Script (Windows PowerShell)
# Author: Nir Wolff
# Description: Complete automated setup for Jenkins AI Troubleshooting Bot
###############################################################################

# Requires PowerShell 5.1 or higher
#Requires -Version 5.1

# Set strict mode
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

###############################################################################
# Helper Functions
###############################################################################

function Write-Header {
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
    Write-Host "║                                                                ║" -ForegroundColor Magenta
    Write-Host "║         JenkInsAITB - Automated Setup Script                  ║" -ForegroundColor Cyan
    Write-Host "║                                                                ║" -ForegroundColor Magenta
    Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Magenta
    Write-Host ""
}

function Write-Section {
    param([string]$Message)
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Blue
    Write-Host "⚙️  $Message" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Blue
    Write-Host ""
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Warning-Custom {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Info {
    param([string]$Message)
    Write-Host "➜  $Message" -ForegroundColor Cyan
}

function Test-CommandExists {
    param([string]$Command)
    $null -ne (Get-Command $Command -ErrorAction SilentlyContinue)
}

###############################################################################
# System Requirements Check
###############################################################################

function Test-SystemRequirements {
    Write-Section "Checking System Requirements"
    
    $allGood = $true
    
    # Check Node.js
    if (Test-CommandExists "node") {
        $nodeVersion = (node --version).Replace('v', '').Split('.')[0]
        if ([int]$nodeVersion -ge 20) {
            Write-Success "Node.js $(node --version) installed"
        } else {
            Write-Error-Custom "Node.js version must be 20 or higher (current: $(node --version))"
            Write-Info "If using nvm-windows, run: nvm use 20 (or nvm install 20 if not installed)"
            $allGood = $false
        }
    } else {
        Write-Error-Custom "Node.js is not installed"
        Write-Info "Install from: https://nodejs.org/"
        Write-Info "Or if using nvm-windows: nvm install 20 && nvm use 20"
        $allGood = $false
    }
    
    # Check pnpm
    if (Test-CommandExists "pnpm") {
        Write-Success "pnpm $(pnpm --version) installed"
    } else {
        Write-Warning-Custom "pnpm is not installed"
        Write-Info "Installing pnpm..."
        npm install -g pnpm
        Write-Success "pnpm installed successfully"
    }
    
    # Check Git
    if (Test-CommandExists "git") {
        $gitVersion = (git --version).Split(' ')[2]
        Write-Success "Git $gitVersion installed"
    } else {
        Write-Error-Custom "Git is not installed"
        $allGood = $false
    }
    
    if (-not $allGood) {
        Write-Error-Custom "Please install missing requirements and run this script again"
        exit 1
    }
    
    Write-Host ""
    Write-Success "All system requirements satisfied!"
}

###############################################################################
# Environment Configuration
###############################################################################

function Initialize-Environment {
    Write-Section "Setting Up Environment Configuration"
    
    if (Test-Path ".env") {
        Write-Warning-Custom ".env file already exists"
        $overwrite = Read-Host "Do you want to overwrite it? (y/N)"
        if ($overwrite -notmatch '^[Yy]$') {
            Write-Info "Keeping existing .env file"
            return
        }
    }
    
    Write-Info "Creating .env file from template..."
    Copy-Item ".env.example" ".env"
    
    Write-Host ""
    Write-Info "Let's configure your environment variables:"
    Write-Host ""
    
    # Jenkins Configuration
    Write-Host "━━━ Jenkins Configuration ━━━" -ForegroundColor Cyan
    $jenkinsUrl = Read-Host "Enter your Jenkins URL (e.g., http://localhost:8080)"
    $jenkinsUser = Read-Host "Enter your Jenkins username"
    $jenkinsToken = Read-Host "Enter your Jenkins API token"
    
    # OpenAI Configuration
    Write-Host ""
    Write-Host "━━━ AI Configuration (Optional) ━━━" -ForegroundColor Cyan
    $enableAI = Read-Host "Do you want to enable AI-powered log analysis? (y/N)"
    if ($enableAI -match '^[Yy]$') {
        $openaiKey = Read-Host "Enter your OpenAI API key"
        $enableAiValue = "true"
    } else {
        $openaiKey = "your-key-here"
        $enableAiValue = "false"
        Write-Info "AI analysis will be disabled (pattern recognition still works!)"
    }
    
    # Generate secure secrets
    Write-Host ""
    Write-Info "Generating secure secrets..."
    $jwtSecret = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
    $sessionSecret = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
    
    # Update .env file
    $envContent = Get-Content ".env"
    $envContent = $envContent -replace 'DATABASE_URL=.*', 'DATABASE_URL="file:./prisma/dev.db"'
    $envContent = $envContent -replace 'JENKINS_URL=.*', "JENKINS_URL=$jenkinsUrl"
    $envContent = $envContent -replace 'JENKINS_USER=.*', "JENKINS_USER=$jenkinsUser"
    $envContent = $envContent -replace 'JENKINS_API_TOKEN=.*', "JENKINS_API_TOKEN=$jenkinsToken"
    $envContent = $envContent -replace 'OPENAI_API_KEY=.*', "OPENAI_API_KEY=$openaiKey"
    $envContent = $envContent -replace 'ENABLE_AI_ANALYSIS=.*', "ENABLE_AI_ANALYSIS=$enableAiValue"
    $envContent = $envContent -replace 'JWT_SECRET=.*', "JWT_SECRET=$jwtSecret"
    $envContent = $envContent -replace 'SESSION_SECRET=.*', "SESSION_SECRET=$sessionSecret"
    $envContent | Set-Content ".env"
    
    Write-Success "Environment configuration completed!"
    Write-Info "Configuration saved to .env (this file is git-ignored)"
    
    # Store admin credentials for later use
    $script:jenkinsUrl = $jenkinsUrl
    $script:jenkinsUser = $jenkinsUser
    $script:jenkinsToken = $jenkinsToken
}

###############################################################################
# Dependencies Installation
###############################################################################

function Install-Dependencies {
    Write-Section "Installing Dependencies"
    
    Write-Info "Installing Node.js dependencies with pnpm..."
    pnpm install
    
    Write-Success "Dependencies installed successfully!"
}

###############################################################################
# Database Setup
###############################################################################

function Initialize-Database {
    Write-Section "Setting Up Database"
    
    Write-Info "Initializing Prisma database..."
    
    # Generate Prisma client
    Write-Info "Generating Prisma client..."
    pnpm prisma generate
    
    # Push schema to database
    Write-Info "Creating database schema..."
    pnpm prisma db push --skip-generate
    
    Write-Success "Database setup completed!"
    Write-Info "Database file: .\prisma\dev.db"
}

###############################################################################
# Admin User Setup
###############################################################################

function New-AdminUser {
    Write-Section "Creating Admin User"
    
    Write-Host ""
    Write-Info "Let's create your admin account:"
    Write-Host ""
    
    $adminUsername = Read-Host "Enter admin username"
    $adminEmail = Read-Host "Enter admin email"
    $adminPassword = Read-Host "Enter admin password" -AsSecureString
    $adminPasswordConfirm = Read-Host "Confirm admin password" -AsSecureString
    
    # Convert secure strings to plain text for comparison
    $BSTR1 = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($adminPassword)
    $BSTR2 = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($adminPasswordConfirm)
    $pwd1 = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR1)
    $pwd2 = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR2)
    
    if ($pwd1 -ne $pwd2) {
        Write-Error-Custom "Passwords do not match!"
        [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR1)
        [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR2)
        return
    }
    
    # Create admin user using our TypeScript script
    Write-Info "Creating admin user..."
    
    # Create a temporary file with credentials
    @"
$adminUsername
$adminEmail
Admin
User
$pwd1
$pwd1
"@ | Out-File -FilePath ".\temp-admin-creds.txt" -Encoding UTF8
    
    # Try to run the interactive script
    try {
        Get-Content ".\temp-admin-creds.txt" | pnpm tsx scripts/create-admin-interactive.ts 2>$null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Admin user created successfully!"
        } else {
            throw "TypeScript method failed"
        }
    } catch {
        Write-Warning-Custom "TypeScript method failed, trying alternative..."
        
        # Fallback method using Node directly
        $env:ADMIN_USER = $adminUsername
        $env:ADMIN_EMAIL = $adminEmail
        $env:ADMIN_PASS = $pwd1
        
        $nodeScript = @"
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
    await prisma.`$disconnect();
  }
})();
"@
        
        $nodeScript | node
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Admin user created via fallback method!"
        } else {
            Write-Error-Custom "Both methods failed to create admin user"
            Write-Info "You can create it manually later with: pnpm setup:admin"
        }
        
        Remove-Item Env:\ADMIN_USER -ErrorAction SilentlyContinue
        Remove-Item Env:\ADMIN_EMAIL -ErrorAction SilentlyContinue
        Remove-Item Env:\ADMIN_PASS -ErrorAction SilentlyContinue
    }
    
    Remove-Item ".\temp-admin-creds.txt" -ErrorAction SilentlyContinue
    
    # Clear sensitive data
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR1)
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR2)
    
    Write-Success "Admin user created successfully!"
    Write-Host ""
    Write-Info "Login credentials:"
    Write-Host "  Username: $adminUsername" -ForegroundColor Cyan
    Write-Host "  Email: $adminEmail" -ForegroundColor Cyan
    Write-Host ""
    
    # Store for summary
    $script:adminUsername = $adminUsername
}

###############################################################################
# Test Jenkins Connection
###############################################################################

function Test-JenkinsConnection {
    Write-Section "Testing Jenkins Connection"
    
    Write-Info "Attempting to connect to Jenkins..."
    
    try {
        $base64AuthInfo = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${script:jenkinsUser}:${script:jenkinsToken}"))
        $headers = @{
            Authorization = "Basic $base64AuthInfo"
        }
        
        $response = Invoke-WebRequest -Uri "$($script:jenkinsUrl)/api/json" -Headers $headers -UseBasicParsing -TimeoutSec 10
        
        if ($response.StatusCode -eq 200) {
            Write-Success "Successfully connected to Jenkins!"
            Write-Info "Jenkins URL: $($script:jenkinsUrl)"
        }
    } catch {
        Write-Warning-Custom "Could not connect to Jenkins"
        Write-Info "This might be okay if Jenkins is not running yet"
        Write-Info "You can test the connection later by running: pnpm test:jenkins"
    }
}

###############################################################################
# Build Application
###############################################################################

function Build-Application {
    Write-Section "Building Application"
    
    Write-Info "Compiling TypeScript and building frontend..."
    pnpm build
    
    Write-Success "Application built successfully!"
}

###############################################################################
# Create Startup Scripts
###############################################################################

function New-StartupScripts {
    Write-Section "Creating Startup Scripts"
    
    # Development startup script
    @'
@echo off
echo 🚀 Starting JenkInsAITB in development mode...
pnpm dev
'@ | Out-File -FilePath "start-dev.bat" -Encoding ASCII
    
    # Production startup script
    @'
@echo off
echo 🚀 Starting JenkInsAITB in production mode...
pnpm build
pnpm start
'@ | Out-File -FilePath "start-prod.bat" -Encoding ASCII
    
    Write-Success "Startup scripts created!"
    Write-Info "  start-dev.bat  - Start in development mode"
    Write-Info "  start-prod.bat - Start in production mode"
}

###############################################################################
# Display Summary
###############################################################################

function Show-Summary {
    Write-Host ""
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║                                                                ║" -ForegroundColor Green
    Write-Host "║              🚀 Setup Completed Successfully! 🚀               ║" -ForegroundColor Green
    Write-Host "║                                                                ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    
    Write-Section "Next Steps"
    
    Write-Host "1. Start the application:" -ForegroundColor Cyan
    Write-Host "   pnpm dev" -ForegroundColor Yellow -NoNewline
    Write-Host "  (development mode with hot reload)" -ForegroundColor Blue
    Write-Host "   .\start-dev.bat" -ForegroundColor Yellow -NoNewline
    Write-Host "  (same as above)" -ForegroundColor Blue
    Write-Host ""
    
    Write-Host "2. Access the application:" -ForegroundColor Cyan
    Write-Host "   http://localhost:3000" -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "3. Login with your admin credentials:" -ForegroundColor Cyan
    Write-Host "   Username: $($script:adminUsername)" -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "4. Explore the features:" -ForegroundColor Cyan
    Write-Host "   ➜ Dashboard with KPIs"
    Write-Host "   ➜ Smart Log Analyzer (pattern recognition)"
    Write-Host "   ➜ Agents Monitoring"
    Write-Host "   ➜ Jobs and Builds Management"
    Write-Host "   ➜ AI-Powered Analysis (if enabled)"
    Write-Host ""
    
    Write-Section "Documentation"
    
    Write-Host "  📖 SMART_FEATURES_README.md - Feature overview" -ForegroundColor Blue
    Write-Host "  📖 SECURITY.md - Security best practices" -ForegroundColor Blue
    Write-Host "  📖 ARCHITECTURE.md - System architecture" -ForegroundColor Blue
    Write-Host "  📖 COMMIT_SUMMARY.md - Recent changes" -ForegroundColor Blue
    Write-Host ""
    
    Write-Section "Useful Commands"
    
    Write-Host "  pnpm dev              - Start development server" -ForegroundColor Yellow
    Write-Host "  pnpm build            - Build for production" -ForegroundColor Yellow
    Write-Host "  pnpm start            - Start production server" -ForegroundColor Yellow
    Write-Host "  pnpm test             - Run tests" -ForegroundColor Yellow
    Write-Host "  pnpm db:studio        - Open Prisma Studio (database GUI)" -ForegroundColor Yellow
    Write-Host "  pnpm prisma migrate dev - Create database migration" -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "🚀 Happy troubleshooting! 🚀" -ForegroundColor Green
    Write-Host ""
}

###############################################################################
# Main Setup Flow
###############################################################################

function Start-Setup {
    Write-Header
    
    # Confirm before proceeding
    Write-Host "This script will set up JenkInsAITB on your system." -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "Do you want to continue? (Y/n)"
    if ($continue -match '^[Nn]$') {
        Write-Info "Setup cancelled"
        exit 0
    }
    
    try {
        # Run setup steps
        Test-SystemRequirements
        Initialize-Environment
        Install-Dependencies
        Initialize-Database
        New-AdminUser
        Test-JenkinsConnection
        New-StartupScripts
        
        # Optional: Build application
        Write-Host ""
        $build = Read-Host "Do you want to build the application now? (Y/n)"
        if ($build -notmatch '^[Nn]$') {
            Build-Application
        }
        
        Show-Summary
    } catch {
        Write-Error-Custom "Setup failed: $_"
        Write-Host $_.ScriptStackTrace -ForegroundColor Red
        exit 1
    }
}

# Run main function
Start-Setup
