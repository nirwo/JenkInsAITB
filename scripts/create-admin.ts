#!/usr/bin/env tsx

/**
 * Quick Admin User Creation Script (Command Line)
 * Usage: tsx scripts/create-admin.ts <username> <email> <password>
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdminUser() {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║                Create Admin User - JenkInsAITB                 ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
    console.log('Usage: tsx scripts/create-admin.ts <username> <email> <password>\n');
    console.log('Example:');
    console.log('  tsx scripts/create-admin.ts admin admin@example.com MySecurePass123!\n');
    console.log('Or use interactive mode:');
    console.log('  tsx scripts/create-admin-interactive.ts\n');
    console.log('Password Requirements:');
    console.log('  • Minimum 8 characters');
    console.log('  • At least 3 of: lowercase, uppercase, numbers, symbols');
    console.log('  • Recommended: 12+ characters\n');
    process.exit(1);
  }
  
  const [username, email, password] = args;
  
  try {
    // Validate username
    if (username.length < 3) {
      console.error('❌ Username must be at least 3 characters long!');
      process.exit(1);
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      console.error('❌ Username can only contain letters, numbers, hyphens, and underscores!');
      process.exit(1);
    }
    
    // Validate email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      console.error('❌ Invalid email format!');
      process.exit(1);
    }
    
    // Validate password
    if (password.length < 8) {
      console.error('❌ Password must be at least 8 characters long!');
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
      console.error('⚠️  Password is too weak!');
      console.error('   Password must include at least 3 of:');
      console.error('   • Lowercase letters (a-z)');
      console.error('   • Uppercase letters (A-Z)');
      console.error('   • Numbers (0-9)');
      console.error('   • Symbols (!@#$%^&*)');
      process.exit(1);
    }
    
    const strength = strengthScore === 4 ? 'Strong ✓' : 'Medium';
    console.log(`Password strength: ${strength}`);
    
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
      console.log('\n⚠️  User with this username or email already exists!');
      console.log(`   Existing: ${existingUser.username} (${existingUser.email})`);
      console.log('\n   To update, delete the user first or use interactive mode.');
      process.exit(1);
    }
    
    // Hash password
    console.log('\n⚙️  Creating admin user...');
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        isActive: true,
      },
    });
    
    console.log('\n✅ Admin user created successfully!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('Login credentials:');
    console.log(`  Username: ${user.username}`);
    console.log(`  Email:    ${user.email}`);
    console.log(`  Role:     ${user.role}`);
    console.log(`  ID:       ${user.id}`);
    console.log('\n═══════════════════════════════════════════════════════════════\n');
    console.log('🚀 Login at: http://localhost:9011\n');
    
  } catch (error: any) {
    console.error('\n❌ Error creating admin user:', error.message || error);
    
    if (error.code === 'P2002') {
      console.error('\n   This username or email is already taken.');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createAdminUser();
