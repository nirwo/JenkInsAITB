#!/usr/bin/env node

// Configure JenKinds for Remote Access
// Automatically detects machine IP and updates configuration

const fs = require('fs');
const path = require('path');
const { networkInterfaces } = require('os');

console.log('🌐 JenKinds Remote Access Configuration');
console.log('═'.repeat(50));

// Get machine IP
function getMachineIP() {
  const nets = networkInterfaces();
  
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return null;
}

const machineIP = getMachineIP();

if (!machineIP) {
  console.log('❌ Could not detect machine IP address');
  console.log('💡 Please manually set your IP in .env:');
  console.log('   APP_URL=http://YOUR_IP:6001');
  process.exit(1);
}

console.log(`📡 Detected machine IP: ${machineIP}`);

// Update .env file
const envPath = path.join(process.cwd(), '.env');
const envExamplePath = path.join(process.cwd(), '.env.example');

// Create .env if it doesn't exist
if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ Created .env from .env.example');
  } else {
    console.log('❌ No .env.example found');
    process.exit(1);
  }
}

// Read current .env
let envContent = fs.readFileSync(envPath, 'utf8');

// Update or add the URLs and settings
const newValues = {
  'APP_URL': `http://${machineIP}:6001`,
  'API_URL': `http://${machineIP}:6001`,
  'VITE_API_URL': `http://${machineIP}:6001`,
  'NODE_ENV': 'production',
  'HOST': '0.0.0.0'
};

Object.entries(newValues).forEach(([key, value]) => {
  const regex = new RegExp(`^${key}=.*$`, 'm');
  if (envContent.match(regex)) {
    envContent = envContent.replace(regex, `${key}=${value}`);
    console.log(`🔄 Updated ${key}=${value}`);
  } else {
    envContent += `\n${key}=${value}`;
    console.log(`➕ Added ${key}=${value}`);
  }
});

// Write updated .env
fs.writeFileSync(envPath, envContent);

console.log('');
console.log('✅ Configuration completed!');
console.log('');
console.log('🎯 Next Steps:');
console.log('1. Build the application: pnpm build');
console.log('2. Start production server: pnpm start:prod');
console.log('');
console.log('🌐 Access URLs:');
console.log(`   Frontend: http://${machineIP}:6001`);
console.log(`   API: http://${machineIP}:6001/health`);
console.log(`   Local: http://localhost:6001`);
console.log('');
console.log('🔒 Firewall Notes:');
console.log(`   Ensure port 6001 is open for incoming connections`);
console.log(`   Test locally first: curl http://localhost:6001/health`);
console.log(`   Test remotely: curl http://${machineIP}:6001/health`);
console.log('');