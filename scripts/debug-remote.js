#!/usr/bin/env node

// Remote System Debug Script for JenKinds Production Issues
// Run this script on your remote system to diagnose 404 issues

const fs = require('fs');
const path = require('path');

console.log('🔍 JenKinds Production Debug Script');
console.log('═'.repeat(50));
console.log();

// Check 1: Environment Variables
console.log('1️⃣ Environment Variables:');
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`);
console.log(`   API_PORT: ${process.env.API_PORT || 'undefined'}`);
console.log(`   PORT: ${process.env.PORT || 'undefined'}`);
console.log();

// Check 2: .env file exists
console.log('2️⃣ .env file:');
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  console.log('   ✅ .env file exists');
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const portLines = envContent.split('\n').filter(line => 
      line.includes('PORT') && !line.startsWith('#')
    );
    portLines.forEach(line => console.log(`   📝 ${line.trim()}`));
  } catch (err) {
    console.log(`   ❌ Error reading .env: ${err.message}`);
  }
} else {
  console.log('   ❌ .env file does not exist');
}
console.log();

// Check 3: Built files
console.log('3️⃣ Built Files:');
const distPath = path.join(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  console.log('   ✅ dist/ directory exists');
  
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    console.log('   ✅ dist/index.html exists');
    const stats = fs.statSync(indexPath);
    console.log(`   📏 Size: ${stats.size} bytes`);
    console.log(`   📅 Modified: ${stats.mtime.toISOString()}`);
  } else {
    console.log('   ❌ dist/index.html missing');
  }
  
  const serverPath = path.join(distPath, 'server', 'index.js');
  if (fs.existsSync(serverPath)) {
    console.log('   ✅ dist/server/index.js exists');
  } else {
    console.log('   ❌ dist/server/index.js missing');
  }
  
  // List dist contents
  try {
    const files = fs.readdirSync(distPath);
    console.log(`   📁 dist/ contents: ${files.join(', ')}`);
  } catch (err) {
    console.log(`   ❌ Error reading dist/: ${err.message}`);
  }
} else {
  console.log('   ❌ dist/ directory does not exist');
  console.log('   💡 Run: pnpm build');
}
console.log();

// Check 4: Package.json scripts
console.log('4️⃣ Package.json:');
try {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log(`   📦 Name: ${pkg.name}`);
  console.log(`   🏷️  Version: ${pkg.version}`);
  console.log(`   📜 Scripts:`);
  if (pkg.scripts) {
    ['start', 'start:prod', 'build'].forEach(script => {
      if (pkg.scripts[script]) {
        console.log(`      ${script}: ${pkg.scripts[script]}`);
      }
    });
  }
} catch (err) {
  console.log(`   ❌ Error reading package.json: ${err.message}`);
}
console.log();

// Check 5: Current working directory
console.log('5️⃣ Working Directory:');
console.log(`   📂 Current: ${process.cwd()}`);
console.log(`   📋 Contents:`);
try {
  const files = fs.readdirSync(process.cwd())
    .filter(f => !f.startsWith('.') && !f.includes('node_modules'))
    .slice(0, 10);
  console.log(`      ${files.join(', ')}`);
} catch (err) {
  console.log(`   ❌ Error: ${err.message}`);
}
console.log();

// Check 6: Dependencies
console.log('6️⃣ Key Dependencies:');
try {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const checkDeps = ['@fastify/static', 'dotenv', 'fastify'];
  checkDeps.forEach(dep => {
    const version = pkg.dependencies?.[dep] || pkg.devDependencies?.[dep];
    if (version) {
      console.log(`   ✅ ${dep}: ${version}`);
    } else {
      console.log(`   ❌ ${dep}: not found`);
    }
  });
} catch (err) {
  console.log(`   ❌ Error checking dependencies: ${err.message}`);
}
console.log();

// Recommendations
console.log('💡 Troubleshooting Steps:');
console.log();
console.log('If dist/ is missing:');
console.log('   pnpm install');
console.log('   pnpm build');
console.log();
console.log('If .env is missing:');
console.log('   cp .env.example .env');
console.log('   # Edit .env with your settings');
console.log();
console.log('To start production server:');
console.log('   NODE_ENV=production pnpm start');
console.log('   # OR');
console.log('   pnpm start:prod');
console.log();
console.log('Test endpoints:');
console.log('   curl http://localhost:6001/health');
console.log('   curl http://localhost:6001/');
console.log();
console.log('Check server logs:');
console.log('   pnpm start:prod 2>&1 | tee server.log');
console.log();