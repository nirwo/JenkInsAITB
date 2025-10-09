#!/usr/bin/env tsx

/**
 * Delete User Script
 * Usage: tsx scripts/delete-user.ts <username>
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteUser() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║                Delete User - JenkInsAITB                       ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
    console.log('Usage: tsx scripts/delete-user.ts <username>\n');
    console.log('Example:');
    console.log('  tsx scripts/delete-user.ts oldadmin\n');
    console.log('To see all users:');
    console.log('  tsx scripts/list-users.ts\n');
    process.exit(1);
  }
  
  const [username] = args;
  
  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        email: true,
        role: true
      }
    });
    
    if (!user) {
      console.error(`\n❌ User '${username}' not found!`);
      
      // List available users
      const users = await prisma.user.findMany({
        select: { username: true, email: true, role: true }
      });
      
      if (users.length > 0) {
        console.log('\nAvailable users:');
        users.forEach(u => {
          console.log(`  • ${u.username} (${u.email}) - ${u.role}`);
        });
      }
      
      process.exit(1);
    }
    
    console.log(`\n⚠️  You are about to delete:`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Email:    ${user.email}`);
    console.log(`   Role:     ${user.role}`);
    console.log(`   ID:       ${user.id}`);
    console.log('\nThis action cannot be undone!\n');
    
    // Delete user (cascade will handle related records)
    await prisma.user.delete({
      where: { username }
    });
    
    console.log(`✅ User '${username}' deleted successfully!\n`);
    
  } catch (error: any) {
    console.error('\n❌ Error deleting user:', error.message || error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
deleteUser();
