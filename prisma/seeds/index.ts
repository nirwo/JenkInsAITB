import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create Super Admin user
  const adminEmail = 'admin@jenkinds.io';
  const adminPassword = 'Admin@123456';

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log('✅ Admin user already exists');
  } else {
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        username: 'admin',
        passwordHash,
        role: UserRole.ADMIN,
        firstName: 'Super',
        lastName: 'Admin',
        isActive: true,
      },
    });

    console.log('✅ Created Super Admin user:');
    console.log(`   📧 Email: ${adminEmail}`);
    console.log(`   🔑 Password: ${adminPassword}`);
    console.log(`   👤 Username: admin`);
    console.log(`   🎭 Role: ${admin.role}`);
  }

  // Create demo user
  const demoEmail = 'demo@jenkinds.io';
  const demoPassword = 'Demo@123456';

  const existingDemo = await prisma.user.findUnique({
    where: { email: demoEmail },
  });

  if (existingDemo) {
    console.log('✅ Demo user already exists');
  } else {
    const passwordHash = await bcrypt.hash(demoPassword, 10);

    const demo = await prisma.user.create({
      data: {
        email: demoEmail,
        username: 'demo',
        passwordHash,
        role: UserRole.USER,
        firstName: 'Demo',
        lastName: 'User',
        isActive: true,
      },
    });

    console.log('✅ Created Demo user:');
    console.log(`   📧 Email: ${demoEmail}`);
    console.log(`   🔑 Password: ${demoPassword}`);
    console.log(`   👤 Username: demo`);
    console.log(`   🎭 Role: ${demo.role}`);
  }

  console.log('\n🎉 Database seeding completed!');
  console.log('\n📝 Login Credentials:');
  console.log('┌─────────────────────────────────────────────────┐');
  console.log('│  SUPER ADMIN                                    │');
  console.log('├─────────────────────────────────────────────────┤');
  console.log(`│  Email:    ${adminEmail.padEnd(33)}│`);
  console.log(`│  Password: ${adminPassword.padEnd(33)}│`);
  console.log('├─────────────────────────────────────────────────┤');
  console.log('│  DEMO USER                                      │');
  console.log('├─────────────────────────────────────────────────┤');
  console.log(`│  Email:    ${demoEmail.padEnd(33)}│`);
  console.log(`│  Password: ${demoPassword.padEnd(33)}│`);
  console.log('└─────────────────────────────────────────────────┘');
  console.log('\n⚠️  IMPORTANT: Change these passwords in production!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
