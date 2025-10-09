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
    
    if (password !== confirmPassword) {
      console.error('\n❌ Passwords do not match!');
      process.exit(1);
    }
    
    if (password.length < 6) {
      console.error('\n❌ Password must be at least 6 characters long!');
      process.exit(1);
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
    console.log('🚀 You can now login at: http://localhost:3000\n');
    
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
