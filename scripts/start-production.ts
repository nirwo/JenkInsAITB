#!/usr/bin/env tsx

import { spawn } from 'child_process';
import { config } from 'dotenv';

// Load environment variables
config();

const PORT = process.env.API_PORT || '9011';
const APP_URL = `http://localhost:${PORT}`;

console.log('🚀 Starting JenKinds in Production Mode');
console.log('━'.repeat(50));
console.log(`📱 Application URL: ${APP_URL}`);
console.log(`🔍 Health Check: ${APP_URL}/health`);
console.log(`📊 Metrics: ${APP_URL}/metrics`);
console.log('━'.repeat(50));
console.log();

// Start the production server
const server = spawn('pnpm', ['start:prod'], {
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'production' }
});

// Wait a moment for server to start, then open browser
setTimeout(() => {
  console.log(`🌐 Opening browser at ${APP_URL}...`);
  
  // Cross-platform browser opening
  const openCommand = process.platform === 'darwin' ? 'open' 
                    : process.platform === 'win32' ? 'start' 
                    : 'xdg-open';
  
  spawn(openCommand, [APP_URL], { detached: true, stdio: 'ignore' });
}, 2000);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  server.kill('SIGTERM');
  process.exit(0);
});

server.on('exit', (code) => {
  console.log(`Server exited with code ${code}`);
  process.exit(code);
});