import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdminUser() {
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const adminUser = await prisma.user.create({
    data: {
      name: 'Admin',
      email: 'admin@cauvery.com',
      password: hashedPassword,
      phone: '9999999999',
      role: UserRole.ADMIN,
    },
  });

  console.log('Created admin user:', adminUser.email);
}

async function main() {
  console.log('Start seeding...');
  
  try {
    await createAdminUser();
    console.log('Seeding finished');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 