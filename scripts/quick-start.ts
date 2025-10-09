#!/usr/bin/env node

/**
 * Quick Start Script
 * Fast setup for development
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(message: string, color = colors.cyan) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message: string) {
  console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

function error(message: string) {
  console.error(`${colors.red}❌ ${message}${colors.reset}`);
}

function info(message: string) {
  console.log(`${colors.blue}ℹ️  ${message}${colors.reset}`);
}

function exec(command: string, description: string) {
  log(`\n⚙️  ${description}...`, colors.cyan);
  try {
    execSync(command, { stdio: 'inherit' });
    success(description);
  } catch (err) {
    error(`Failed: ${description}`);
    throw err;
  }
}

async function quickStart() {
  console.log('\n' + '═'.repeat(65));
  log('     🚀 JenkInsAITB Quick Start', colors.magenta);
  console.log('═'.repeat(65) + '\n');
  
  try {
    // Check if .env exists
    const envExists = fs.existsSync('.env');
    if (!envExists) {
      info('.env file not found');
      log('\nFor full setup with configuration, run: ./setup.sh\n', colors.yellow);
      log('Quick start will use default configuration...', colors.yellow);
      
      // Copy example
      fs.copyFileSync('.env.example', '.env');
      success('Created .env from example');
    } else {
      success('.env file exists');
    }
    
    // Check if database exists
    const dbExists = fs.existsSync('prisma/dev.db');
    if (!dbExists) {
      info('Database not found');
      
      // Setup database
      exec('pnpm prisma generate', 'Generate Prisma client');
      exec('pnpm prisma db push', 'Create database schema');
      
      success('Database initialized');
    } else {
      success('Database exists');
      // Just ensure Prisma client is generated
      exec('pnpm prisma generate', 'Generate Prisma client');
    }
    
    // Check if node_modules exists
    const nodeModulesExists = fs.existsSync('node_modules');
    if (!nodeModulesExists) {
      exec('pnpm install', 'Install dependencies');
    } else {
      success('Dependencies installed');
    }
    
    console.log('\n' + '═'.repeat(65));
    log('     ✅ Quick Start Complete!', colors.green);
    console.log('═'.repeat(65) + '\n');
    
    log('Next steps:\n', colors.cyan);
    console.log('  1. Start the application:');
    log('     pnpm dev\n', colors.yellow);
    
    console.log('  2. Create admin user (if needed):');
    log('     pnpm setup:admin\n', colors.yellow);
    
    console.log('  3. Configure Jenkins connection:');
    log('     Edit .env and add your Jenkins credentials\n', colors.yellow);
    
    console.log('  4. Test Jenkins connection:');
    log('     pnpm test:jenkins\n', colors.yellow);
    
    console.log('For full interactive setup, run:');
    log('  ./setup.sh  (macOS/Linux)', colors.yellow);
    log('  .\\setup.ps1 (Windows)\n', colors.yellow);
    
  } catch (err) {
    error('\nQuick start failed!');
    console.error(err);
    process.exit(1);
  }
}

quickStart();
