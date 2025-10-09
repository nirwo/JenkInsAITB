#!/usr/bin/env tsx

/**
 * List Users Script
 * Shows all users in the database
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║                    User List - JenkInsAITB                     ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
    
    if (users.length === 0) {
      console.log('No users found.\n');
      console.log('Create an admin user:');
      console.log('  pnpm create:admin\n');
      return;
    }
    
    console.log(`Total users: ${users.length}\n`);
    
    users.forEach((user, index) => {
      const status = user.isActive ? '🟢 Active' : '🔴 Inactive';
      const lastLogin = user.lastLoginAt 
        ? new Date(user.lastLoginAt).toLocaleString()
        : 'Never';
      
      console.log(`${index + 1}. ${user.username}`);
      console.log(`   Email:      ${user.email}`);
      console.log(`   Role:       ${user.role}`);
      console.log(`   Status:     ${status}`);
      console.log(`   Created:    ${new Date(user.createdAt).toLocaleString()}`);
      console.log(`   Last Login: ${lastLogin}`);
      console.log(`   ID:         ${user.id}`);
      console.log('');
    });
    
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('Manage users:');
    console.log('  Create:       pnpm create:admin');
    console.log('  Reset password: tsx scripts/reset-password.ts <username> <password>');
    console.log('  Delete:       tsx scripts/delete-user.ts <username>');
    console.log('\n');
    
  } catch (error: any) {
    console.error('\n❌ Error listing users:', error.message || error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
listUsers();
