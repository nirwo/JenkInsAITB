#!/usr/bin/env node
/**
 * Port Configuration Script
 * 
 * Easily change all application ports from one place.
 * This script updates all configuration files with your chosen port range.
 * 
 * Usage:
 *   node scripts/configure-ports.cjs [base-port]
 * 
 * Examples:
 *   node scripts/configure-ports.cjs 3000  # Use 3000 range (3000, 3001, 3002)
 *   node scripts/configure-ports.cjs 6000  # Use 6000 range (6000, 6001, 6002)
 *   node scripts/configure-ports.cjs 8000  # Use 8000 range (8000, 8001, 8002)
 */

const fs = require('fs');
const path = require('path');

// Default port configuration
const DEFAULT_BASE_PORT = 6000;

// Get base port from command line argument
const basePort = process.argv[2] ? parseInt(process.argv[2]) : DEFAULT_BASE_PORT;

// Validate port number
if (isNaN(basePort) || basePort < 1024 || basePort > 65533) {
  console.error('❌ Error: Port must be a number between 1024 and 65533');
  console.log('\nUsage: node scripts/configure-ports.cjs [base-port]');
  console.log('Example: node scripts/configure-ports.cjs 6000');
  process.exit(1);
}

// Calculate port numbers
const PORT_CONFIG = {
  CLIENT_PORT: basePort,           // Frontend dev server
  API_PORT: basePort + 1,          // Backend API
  GRAFANA_PORT: basePort + 2,      // Grafana dashboard
};

console.log('🔧 Port Configuration');
console.log('━'.repeat(50));
console.log(`Frontend (Vite):  ${PORT_CONFIG.CLIENT_PORT}`);
console.log(`Backend API:      ${PORT_CONFIG.API_PORT}`);
console.log(`Grafana:          ${PORT_CONFIG.GRAFANA_PORT}`);
console.log('━'.repeat(50));
console.log();

// Files to update
const FILES_TO_UPDATE = [
  {
    path: '.env.example',
    updates: [
      { pattern: /PORT=\d+/, replacement: `PORT=${PORT_CONFIG.CLIENT_PORT}` },
      { pattern: /API_PORT=\d+/, replacement: `API_PORT=${PORT_CONFIG.API_PORT}` },
      { pattern: /APP_URL=http:\/\/localhost:\d+/, replacement: `APP_URL=http://localhost:${PORT_CONFIG.CLIENT_PORT}` },
      { pattern: /API_URL=http:\/\/localhost:\d+/, replacement: `API_URL=http://localhost:${PORT_CONFIG.API_PORT}` },
    ],
  },
  {
    path: 'vite.config.ts',
    updates: [
      { pattern: /port:\s*\d+,/, replacement: `port: ${PORT_CONFIG.CLIENT_PORT},` },
      { pattern: /target:\s*'http:\/\/localhost:\d+'/, replacement: `target: 'http://localhost:${PORT_CONFIG.API_PORT}'` },
      { pattern: /target:\s*'ws:\/\/localhost:\d+'/, replacement: `target: 'ws://localhost:${PORT_CONFIG.API_PORT}'` },
    ],
  },
  {
    path: 'server/index.ts',
    updates: [
      { pattern: /const PORT = Number\(process\.env\.API_PORT\) \|\| \d+;/, replacement: `const PORT = Number(process.env.API_PORT) || ${PORT_CONFIG.API_PORT};` },
    ],
  },
  {
    path: 'Dockerfile',
    updates: [
      { pattern: /EXPOSE \d+ \d+/, replacement: `EXPOSE ${PORT_CONFIG.CLIENT_PORT} ${PORT_CONFIG.API_PORT}` },
      { pattern: /localhost:\d+\/health/, replacement: `localhost:${PORT_CONFIG.API_PORT}/health` },
    ],
  },
  {
    path: 'docker-compose.yml',
    updates: [
      { pattern: /- "\d+:3000"/, replacement: `- "${PORT_CONFIG.GRAFANA_PORT}:3000"` },
    ],
  },
];

// Update .env file if it exists
const envPath = '.env';
if (fs.existsSync(envPath)) {
  FILES_TO_UPDATE.push({
    path: envPath,
    updates: [
      { pattern: /PORT=\d+/, replacement: `PORT=${PORT_CONFIG.CLIENT_PORT}` },
      { pattern: /API_PORT=\d+/, replacement: `API_PORT=${PORT_CONFIG.API_PORT}` },
      { pattern: /APP_URL=http:\/\/localhost:\d+/, replacement: `APP_URL=http://localhost:${PORT_CONFIG.CLIENT_PORT}` },
      { pattern: /API_URL=http:\/\/localhost:\d+/, replacement: `API_URL=http://localhost:${PORT_CONFIG.API_PORT}` },
    ],
  });
}

// Perform updates
let filesUpdated = 0;
let filesSkipped = 0;

FILES_TO_UPDATE.forEach(fileConfig => {
  const filePath = path.join(process.cwd(), fileConfig.path);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⏭️  Skipping ${fileConfig.path} (not found)`);
    filesSkipped++;
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  fileConfig.updates.forEach(update => {
    if (update.pattern.test(content)) {
      content = content.replace(update.pattern, update.replacement);
      modified = true;
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated ${fileConfig.path}`);
    filesUpdated++;
  } else {
    console.log(`⏭️  No changes needed in ${fileConfig.path}`);
    filesSkipped++;
  }
});

console.log();
console.log('━'.repeat(50));
console.log(`✅ Updated ${filesUpdated} file(s)`);
if (filesSkipped > 0) {
  console.log(`⏭️  Skipped ${filesSkipped} file(s)`);
}
console.log('━'.repeat(50));
console.log();
console.log('📝 Next Steps:');
console.log('1. Review the changes: git diff');
console.log('2. Rebuild the application: pnpm build');
console.log('3. Start the server:');
console.log('   - Development: pnpm dev');
console.log('   - Production:  pnpm start (after build)');
console.log();
console.log(`🌐 Access your application at:`);
console.log(`   Frontend: http://localhost:${PORT_CONFIG.CLIENT_PORT}`);
console.log(`   Backend:  http://localhost:${PORT_CONFIG.API_PORT}`);
console.log(`   Grafana:  http://localhost:${PORT_CONFIG.GRAFANA_PORT}`);
console.log();
