#!/usr/bin/env node

// CORS Diagnostic Script for Remote Access
// Run this on your remote system to test CORS and API connectivity

const https = require('https');
const http = require('http');

console.log('🔍 JenKinds Remote CORS Diagnostic');
console.log('═'.repeat(50));

// Get command line arguments
const args = process.argv.slice(2);
const serverIP = args[0] || 'localhost';
const serverPort = args[1] || '6001';

const baseURL = `http://${serverIP}:${serverPort}`;

console.log(`📡 Testing server: ${baseURL}`);
console.log('');

// Test 1: Basic connectivity
function testConnectivity() {
  return new Promise((resolve, reject) => {
    console.log('1️⃣ Testing basic connectivity...');
    
    const req = http.get(`${baseURL}/health`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`   ✅ Health endpoint: ${res.statusCode}`);
        console.log(`   📋 Response: ${data.trim()}`);
        resolve();
      });
    });
    
    req.on('error', (err) => {
      console.log(`   ❌ Connection failed: ${err.message}`);
      reject(err);
    });
    
    req.setTimeout(5000, () => {
      console.log(`   ❌ Timeout connecting to ${baseURL}`);
      reject(new Error('Timeout'));
    });
  });
}

// Test 2: CORS preflight
function testCORS() {
  return new Promise((resolve, reject) => {
    console.log('2️⃣ Testing CORS preflight...');
    
    const options = {
      hostname: serverIP,
      port: serverPort,
      path: '/trpc',
      method: 'OPTIONS',
      headers: {
        'Origin': `http://${serverIP}:${serverPort}`,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    };
    
    const req = http.request(options, (res) => {
      console.log(`   📊 Status: ${res.statusCode}`);
      console.log(`   🌐 CORS Headers:`);
      
      const corsHeaders = [
        'access-control-allow-origin',
        'access-control-allow-credentials',
        'access-control-allow-methods',
        'access-control-allow-headers'
      ];
      
      corsHeaders.forEach(header => {
        const value = res.headers[header];
        if (value) {
          console.log(`      ${header}: ${value}`);
        } else {
          console.log(`      ${header}: ❌ MISSING`);
        }
      });
      
      resolve();
    });
    
    req.on('error', (err) => {
      console.log(`   ❌ CORS test failed: ${err.message}`);
      reject(err);
    });
    
    req.end();
  });
}

// Test 3: tRPC endpoint
function testTRPC() {
  return new Promise((resolve, reject) => {
    console.log('3️⃣ Testing tRPC endpoint...');
    
    const postData = JSON.stringify({
      "0": {
        "json": null
      }
    });
    
    const options = {
      hostname: serverIP,
      port: serverPort,
      path: '/trpc/auth.me',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length,
        'Origin': `http://${serverIP}:${serverPort}`
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`   📊 Status: ${res.statusCode}`);
        console.log(`   📋 Response: ${data.trim().substring(0, 100)}...`);
        resolve();
      });
    });
    
    req.on('error', (err) => {
      console.log(`   ❌ tRPC test failed: ${err.message}`);
      reject(err);
    });
    
    req.write(postData);
    req.end();
  });
}

// Run all tests
async function runDiagnostics() {
  try {
    await testConnectivity();
    console.log('');
    await testCORS();
    console.log('');
    await testTRPC();
    console.log('');
    console.log('✅ All tests completed!');
    console.log('');
    console.log('💡 If you see CORS issues:');
    console.log('   1. Ensure NODE_ENV=production on the server');
    console.log('   2. Restart the server: pnpm start:prod');
    console.log('   3. Check your .env has the right VITE_API_URL');
    console.log('');
    console.log('🌐 Frontend should use:');
    console.log(`   VITE_API_URL=http://${serverIP}:${serverPort}`);
    
  } catch (error) {
    console.log('');
    console.log('❌ Diagnostic failed. Check:');
    console.log('   1. Server is running on the target machine');
    console.log('   2. Port 6001 is accessible');
    console.log('   3. Firewall allows incoming connections');
    console.log(`   4. Try: curl http://${serverIP}:${serverPort}/health`);
  }
}

runDiagnostics();