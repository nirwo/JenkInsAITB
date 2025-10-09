#!/usr/bin/env node
/**
 * Post-build script to create package.json in dist/server
 * This marks the compiled server code as CommonJS
 */

const fs = require('fs');
const path = require('path');

// Create a package.json in dist/server to mark it as CommonJS
const packageJson = {
  type: 'commonjs',
};

const distServerPath = path.join(process.cwd(), 'dist', 'server');
const packageJsonPath = path.join(distServerPath, 'package.json');

// Ensure dist/server directory exists
if (!fs.existsSync(distServerPath)) {
  console.error('❌ dist/server directory not found. Build the server first.');
  process.exit(1);
}

fs.writeFileSync(
  packageJsonPath,
  JSON.stringify(packageJson, null, 2)
);

console.log('✅ Created dist/server/package.json with type: commonjs');
