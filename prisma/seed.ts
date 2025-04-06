import { PrismaClient, EmployeeRole } from '@prisma/client';
import { hash } from 'bcryptjs';
import { ROLE_HIERARCHY_LEVELS } from '../lib/employee-roles';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Create admin user
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@cauvery.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const hashedPassword = await hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: 'Admin',
      password: hashedPassword,
      phone: '1234567890',
      role: 'ADMIN',
    },
  });

  console.log(`Created admin user: ${admin.email}`);

  // Add any additional seed data here if needed
  // For example, create test employees with proper hierarchy levels:
  
  /*
  // Create a test Executive Director
  const edUser = await prisma.user.create({
    data: {
      name: 'John Executive',
      email: 'ed@example.com',
      password: await hash('password123', 10),
      phone: '9876543210',
      role: 'EMPLOYEE',
      employee: {
        create: {
          guardianName: 'Parent Name',
          dateOfBirth: new Date('1975-01-01'),
          age: 48,
          gender: 'Male',
          pancardNumber: 'ABCPX1234X',
          aadharCardNumber: '123456789012',
          bankName: 'State Bank',
          bankBranch: 'Main Branch',
          accountNumber: '1234567890',
          ifscCode: 'SBIN0000123',
          dateOfJoining: new Date('2020-01-01'),
          employeeRole: EmployeeRole.EXECUTIVE_DIRECTOR,
          hierarchyLevel: ROLE_HIERARCHY_LEVELS[EmployeeRole.EXECUTIVE_DIRECTOR],
        }
      }
    },
    include: {
      employee: true
    }
  });
  
  // Create a team with the Executive Director as leader
  const team = await prisma.team.create({
    data: {
      leaderId: edUser.employee!.id,
    }
  });
  
  // Update the Executive Director to be part of the team
  await prisma.employee.update({
    where: { id: edUser.employee!.id },
    data: { teamId: team.id }
  });
  */
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('Seeding finished');
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  }); 