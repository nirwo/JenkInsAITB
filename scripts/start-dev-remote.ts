#!/usr/bin/env node

/**
 * Start development mode with remote access
 * Automatically detects machine IP and configures environment
 */

import { spawn } from 'child_process';
import { networkInterfaces } from 'os';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

// Get machine IP
function getMachineIP() {
  const nets = networkInterfaces();
  
  // Try common network interfaces in order of preference
  const interfaces = ['en0', 'eth0', 'en1', 'wlan0'];
  
  for (const iface of interfaces) {
    if (nets[iface]) {
      const ipv4 = nets[iface].find(net => net.family === 'IPv4' && !net.internal);
      if (ipv4) {
        return ipv4.address;
      }
    }
  }
  
  // Fallback: find any IPv4 address
  for (const name of Object.keys(nets)) {
    const interfaces = nets[name];
    if (interfaces) {
      const net = interfaces.find(net => net.family === 'IPv4' && !net.internal);
      if (net) {
        return net.address;
      }
    }
  }
  
  return 'localhost';
}

// Update .env file
function updateEnvFile(ip: string): void {
  const envPath = join(process.cwd(), '.env');
  
  if (!existsSync(envPath)) {
    console.error('❌ .env file not found!');
    process.exit(1);
  }
  
  let envContent = readFileSync(envPath, 'utf-8');
  
  // Update URLs with machine IP
  const updates = {
    'APP_URL': `http://${ip}:6000`,
    'API_URL': `http://${ip}:6001`,
    'VITE_API_URL': `http://${ip}:6001`,
  };
  
  for (const [key, value] of Object.entries(updates)) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}`;
    }
  }
  
  writeFileSync(envPath, envContent);
  console.log('✅ Updated .env file with machine IP');
}

// Main function
async function main() {
  console.log('🚀 Starting development mode with remote access...\n');
  
  const machineIP = getMachineIP();
  console.log(`📍 Detected machine IP: ${machineIP}`);
  
  if (machineIP === 'localhost') {
    console.log('⚠️  Could not detect machine IP, using localhost');
  } else {
    console.log('🔧 Configuring environment for remote access...');
    updateEnvFile(machineIP);
  }
  
  console.log('\n📦 Access URLs:');
  console.log(`   Frontend: http://${machineIP}:6000`);
  console.log(`   Backend:  http://${machineIP}:6001`);
  console.log(`   Local:    http://localhost:6000\n`);
  
  console.log('🎯 Starting dev servers...\n');
  
  // Start development servers with proper environment
  const devProcess = spawn('pnpm', ['dev'], {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      VITE_API_URL: `http://${machineIP}:6001`,
      API_URL: `http://${machineIP}:6001`,
      APP_URL: `http://${machineIP}:6000`,
      HOST: '0.0.0.0',
    }
  });
  
  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n\n👋 Shutting down dev servers...');
    devProcess.kill('SIGINT');
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    devProcess.kill('SIGTERM');
    process.exit(0);
  });
  
  devProcess.on('error', (error) => {
    console.error('❌ Failed to start dev servers:', error);
    process.exit(1);
  });
  
  devProcess.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`❌ Dev servers exited with code ${code}`);
      process.exit(code);
    }
  });
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
