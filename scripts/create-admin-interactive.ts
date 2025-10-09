#!/usr/bin/env node

/**
 * Interactive Admin User Creation Script
 * Prompts for user details and creates an admin account
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as readline from 'readline';

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function questionHidden(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    const stdout = process.stdout;
    
    stdout.write(prompt);
    
    // @ts-ignore - setRawMode exists on TTY
    stdin.setRawMode?.(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    
    let password = '';
    
    const onData = (char: string) => {
      char = char.toString();
      
      if (char === '\n' || char === '\r' || char === '\u0004') {
        // Enter or Ctrl-D
        stdin.removeListener('data', onData);
        // @ts-ignore
        stdin.setRawMode?.(false);
        stdin.pause();
        stdout.write('\n');
        resolve(password);
      } else if (char === '\u0003') {
        // Ctrl-C
        process.exit();
      } else if (char === '\u007F' || char === '\b') {
        // Backspace
        if (password.length > 0) {
          password = password.slice(0, -1);
          stdout.write('\b \b');
        }
      } else {
        password += char;
        stdout.write('*');
      }
    };
    
    stdin.on('data', onData);
  });
}

async function createAdminUser() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                ║');
  console.log('║              Create Admin User - JenkInsAITB                   ║');
  console.log('║                                                                ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  try {
    // Get user input
    const username = await question('Enter admin username: ');
    const email = await question('Enter admin email: ');
    const firstName = await question('Enter first name (optional): ') || 'Admin';
    const lastName = await question('Enter last name (optional): ') || 'User';
    
    const password = await questionHidden('Enter password: ');
    const confirmPassword = await questionHidden('Confirm password: ');
    
    // Validate input
    if (!username || !email || !password) {
      console.error('\n❌ Username, email, and password are required!');
      process.exit(1);
    }
    
    // Validate username
    if (username.length < 3) {
      console.error('\n❌ Username must be at least 3 characters long!');
      process.exit(1);
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      console.error('\n❌ Username can only contain letters, numbers, hyphens, and underscores!');
      process.exit(1);
    }
    
    // Validate email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      console.error('\n❌ Invalid email format!');
      process.exit(1);
    }
    
    // Validate password
    if (password !== confirmPassword) {
      console.error('\n❌ Passwords do not match!');
      process.exit(1);
    }
    
    if (password.length < 8) {
      console.error('\n❌ Password must be at least 8 characters long!');
      console.error('   Recommendation: Use 12+ characters with mixed case, numbers, and symbols');
      process.exit(1);
    }
    
    // Check password strength
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[^a-zA-Z0-9]/.test(password);
    
    const strengthScore = [hasLower, hasUpper, hasNumber, hasSymbol].filter(Boolean).length;
    
    if (strengthScore < 3) {
      console.error('\n⚠️  Password is weak!');
      console.error('   Recommendation: Include uppercase, lowercase, numbers, and symbols');
      const proceed = await question('Continue anyway? (y/N): ');
      if (proceed.toLowerCase() !== 'y') {
        console.log('❌ Operation cancelled');
        process.exit(0);
      }
    } else {
      const strength = strengthScore === 4 ? 'Strong' : 'Medium';
      console.log(`\n✓ Password strength: ${strength}`);
    }
    
    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email }
        ]
      }
    });
    
    if (existingUser) {
      console.log('\n⚠️  User already exists!');
      const overwrite = await question('Do you want to update the existing user? (y/N): ');
      
      if (overwrite.toLowerCase() !== 'y') {
        console.log('❌ Operation cancelled');
        process.exit(0);
      }
    }
    
    // Hash password
    console.log('\n⚙️  Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create or update user
    console.log('⚙️  Creating admin user...');
    const user = await prisma.user.upsert({
      where: { username },
      update: {
        email,
        passwordHash: hashedPassword,
        firstName,
        lastName,
        role: 'ADMIN',
      },
      create: {
        username,
        email,
        passwordHash: hashedPassword,
        firstName,
        lastName,
        role: 'ADMIN',
      },
    });
    
    console.log('\n✅ Admin user created successfully!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('Login credentials:');
    console.log(`  Username: ${user.username}`);
    console.log(`  Email:    ${user.email}`);
    console.log(`  Role:     ${user.role}`);
    console.log('\n═══════════════════════════════════════════════════════════════\n');
    console.log('🚀 You can now login at: http://localhost:9011\n');
    
  } catch (error) {
    console.error('\n❌ Error creating admin user:', error);
    process.exit(1);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

// Run the script
createAdminUser();
