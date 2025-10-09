#!/usr/bin/env node

/**
 * Test Jenkins Connection Script
 * Verifies Jenkins connectivity and credentials
 */

import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

// Simple .env parser (no dependency needed)
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found!');
    console.log('Please run the setup script first: ./setup.sh');
    process.exit(1);
  }
  
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach((line) => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      process.env[key] = value;
    }
  });
}

loadEnv();

const JENKINS_URL = process.env.JENKINS_URL;
const JENKINS_USER = process.env.JENKINS_USER;
const JENKINS_API_TOKEN = process.env.JENKINS_API_TOKEN;

async function testJenkinsConnection() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                ║');
  console.log('║            Jenkins Connection Test - JenkInsAITB               ║');
  console.log('║                                                                ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  // Validate environment variables
  if (!JENKINS_URL || !JENKINS_USER || !JENKINS_API_TOKEN) {
    console.error('❌ Missing Jenkins configuration!\n');
    console.log('Please set the following environment variables in .env:');
    console.log('  - JENKINS_URL');
    console.log('  - JENKINS_USER');
    console.log('  - JENKINS_API_TOKEN');
    console.log('\nRun ./setup.sh to configure automatically.\n');
    process.exit(1);
  }
  
  console.log('Configuration:');
  console.log(`  Jenkins URL: ${JENKINS_URL}`);
  console.log(`  Username:    ${JENKINS_USER}`);
  console.log(`  API Token:   ${'*'.repeat(20)}...\n`);
  
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  try {
    // Test 1: Basic connectivity
    console.log('🔍 Test 1: Basic Connectivity...');
    const basicResponse = await axios.get(`${JENKINS_URL}/api/json`, {
      timeout: 5000,
    }).catch(err => {
      if (err.code === 'ECONNREFUSED') {
        throw new Error('Connection refused - is Jenkins running?');
      }
      if (err.response?.status === 401 || err.response?.status === 403) {
        // Expected - we'll test auth next
        return { data: null, status: err.response.status };
      }
      throw err;
    });
    
    if (basicResponse.status === 401 || basicResponse.status === 403) {
      console.log('✅ Jenkins is running (authentication required)\n');
    } else {
      console.log('✅ Jenkins is running\n');
    }
    
    // Test 2: Authentication
    console.log('🔍 Test 2: Authentication...');
    const authResponse = await axios.get(`${JENKINS_URL}/api/json`, {
      auth: {
        username: JENKINS_USER,
        password: JENKINS_API_TOKEN,
      },
      timeout: 5000,
    });
    
    console.log('✅ Authentication successful\n');
    
    // Test 3: API Access
    console.log('🔍 Test 3: API Access...');
    const apiData = authResponse.data;
    
    console.log('✅ API is accessible\n');
    console.log('Jenkins Information:');
    console.log(`  Version:     ${apiData.mode || 'N/A'}`);
    console.log(`  Jobs:        ${apiData.jobs?.length || 0}`);
    console.log(`  Description: ${apiData.description || 'N/A'}`);
    console.log(`  URL:         ${apiData.url || JENKINS_URL}`);
    console.log('');
    
    // Test 4: Get jobs list
    if (apiData.jobs && apiData.jobs.length > 0) {
      console.log('🔍 Test 4: Jobs List...');
      console.log(`✅ Found ${apiData.jobs.length} jobs\n`);
      console.log('Sample jobs:');
      apiData.jobs.slice(0, 5).forEach((job: any) => {
        console.log(`  - ${job.name} (${job.color})`);
      });
      if (apiData.jobs.length > 5) {
        console.log(`  ... and ${apiData.jobs.length - 5} more`);
      }
      console.log('');
    } else {
      console.log('ℹ️  No jobs found in Jenkins\n');
    }
    
    // Test 5: Check computer/agents
    console.log('🔍 Test 5: Agents/Nodes...');
    try {
      const computerResponse = await axios.get(`${JENKINS_URL}/computer/api/json`, {
        auth: {
          username: JENKINS_USER,
          password: JENKINS_API_TOKEN,
        },
        timeout: 5000,
      });
      
      const computers = computerResponse.data.computer || [];
      console.log(`✅ Found ${computers.length} agents/nodes\n`);
      
      if (computers.length > 0) {
        console.log('Sample agents:');
        computers.slice(0, 5).forEach((computer: any) => {
          const status = computer.offline ? '🔴 Offline' : '🟢 Online';
          console.log(`  - ${computer.displayName} ${status}`);
        });
        if (computers.length > 5) {
          console.log(`  ... and ${computers.length - 5} more`);
        }
        console.log('');
      }
    } catch (error) {
      console.log('⚠️  Could not fetch agents information\n');
    }
    
    // Success summary
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ All tests passed!\n');
    console.log('Jenkins connection is working correctly.');
    console.log('You can now start the application with: pnpm dev\n');
    
  } catch (error: any) {
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.error('❌ Connection test failed!\n');
    
    if (error.code === 'ECONNREFUSED') {
      console.error('Error: Connection refused');
      console.log('\nPossible causes:');
      console.log('  1. Jenkins is not running');
      console.log('  2. Jenkins URL is incorrect');
      console.log('  3. Firewall is blocking the connection\n');
      console.log('Troubleshooting:');
      console.log(`  - Check if Jenkins is running: curl ${JENKINS_URL}`);
      console.log('  - Verify the JENKINS_URL in .env');
      console.log('  - Check firewall settings\n');
    } else if (error.response?.status === 401) {
      console.error('Error: Authentication failed (401 Unauthorized)');
      console.log('\nPossible causes:');
      console.log('  1. Invalid username or API token');
      console.log('  2. API token has been revoked');
      console.log('  3. User does not have access\n');
      console.log('Troubleshooting:');
      console.log('  - Verify username in .env');
      console.log('  - Generate a new API token in Jenkins');
      console.log('  - Path: User Menu → Configure → API Token\n');
    } else if (error.response?.status === 403) {
      console.error('Error: Access forbidden (403 Forbidden)');
      console.log('\nPossible causes:');
      console.log('  1. User does not have sufficient permissions');
      console.log('  2. CSRF protection is enabled\n');
      console.log('Troubleshooting:');
      console.log('  - Check user permissions in Jenkins');
      console.log('  - Ensure user has "Overall/Read" permission\n');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('Error: Connection timeout');
      console.log('\nPossible causes:');
      console.log('  1. Jenkins server is slow to respond');
      console.log('  2. Network connectivity issues');
      console.log('  3. Jenkins URL is incorrect\n');
    } else {
      console.error('Error:', error.message);
      if (error.response) {
        console.log(`HTTP Status: ${error.response.status}`);
      }
      console.log('');
    }
    
    process.exit(1);
  }
}

// Run the test
testJenkinsConnection();
