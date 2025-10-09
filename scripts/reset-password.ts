#!/usr/bin/env tsx

/**
 * Reset Admin Password Script
 * Usage: tsx scripts/reset-password.ts <username> <new-password>
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function resetPassword() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║              Reset User Password - JenkInsAITB                 ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
    console.log('Usage: tsx scripts/reset-password.ts <username> <new-password>\n');
    console.log('Example:');
    console.log('  tsx scripts/reset-password.ts admin MyNewSecurePass123!\n');
    console.log('Password Requirements:');
    console.log('  • Minimum 8 characters');
    console.log('  • At least 3 of: lowercase, uppercase, numbers, symbols');
    console.log('  • Recommended: 12+ characters\n');
    process.exit(1);
  }
  
  const [username, newPassword] = args;
  
  try {
    // Validate password
    if (newPassword.length < 8) {
      console.error('❌ Password must be at least 8 characters long!');
      console.error('   Recommendation: Use 12+ characters with mixed case, numbers, and symbols');
      process.exit(1);
    }
    
    // Check password strength
    const hasLower = /[a-z]/.test(newPassword);
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSymbol = /[^a-zA-Z0-9]/.test(newPassword);
    
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
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { username }
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
    
    console.log(`\nFound user: ${user.username} (${user.email})`);
    
    // Hash new password
    console.log('\n⚙️  Updating password...');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    await prisma.user.update({
      where: { username },
      data: { passwordHash: hashedPassword }
    });
    
    console.log('\n✅ Password updated successfully!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('You can now login with:');
    console.log(`  Username: ${user.username}`);
    console.log(`  Email:    ${user.email}`);
    console.log(`  New Password: (the one you just set)`);
    console.log('\n═══════════════════════════════════════════════════════════════\n');
    console.log('🚀 Login at: http://localhost:9011\n');
    
  } catch (error: any) {
    console.error('\n❌ Error resetting password:', error.message || error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
resetPassword();
