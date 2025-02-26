import { PrismaClient, UserRole, EmployeeRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const hashedPassword = bcrypt.hashSync('password123', 10);

const employeeRoles = [
  EmployeeRole.EXECUTIVE_DIRECTOR,
  EmployeeRole.DIRECTOR,
  EmployeeRole.JOINT_DIRECTOR,
  EmployeeRole.FIELD_OFFICER,
];

async function createSampleUsers() {
  // Create 5 regular users
  for (let i = 1; i <= 5; i++) {
    await prisma.user.create({
      data: {
        name: `User ${i}`,
        email: `user${i}@example.com`,
        password: hashedPassword,
        phone: `98765${i}${i}${i}${i}${i}`,
        address: `Sample Address ${i}`,
        pincode: `56000${i}`,
        role: UserRole.USER,
      },
    });
  }
  console.log('Created 5 sample users');
}

async function createAdminUser() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.log(
      'Admin credentials not found in environment variables. Using default admin credentials.'
    );
    await prisma.user.create({
      data: {
        email: 'admin@cauvery.com',
        name: 'Admin',
        password: hashedPassword, // This will use the same password123
        phone: '9876543210',
        role: UserRole.ADMIN,
      },
    });
    console.log('Default admin user created successfully');
    return;
  }

  await prisma.user.create({
    data: {
      email: adminEmail,
      name: 'Admin',
      password: adminPassword,
      phone: '9876543210',
      role: UserRole.ADMIN,
    },
  });
  console.log('Admin user created with provided credentials');
}

async function createSampleEmployees() {
  // Create 10 employees with different roles
  for (let i = 1; i <= 10; i++) {
    const employeeUser = await prisma.user.create({
      data: {
        name: `Employee ${i}`,
        email: `employee${i}@cauvery.com`,
        password: hashedPassword,
        phone: `98765${i}${i}${i}${i}${i}`,
        role: UserRole.EMPLOYEE,
      },
    });

    await prisma.employee.create({
      data: {
        guardianName: `Guardian ${i}`,
        dateOfBirth: new Date(1990, i % 12, (i % 28) + 1),
        age: 30 + (i % 5),
        gender: i % 2 === 0 ? 'Male' : 'Female',
        pancardNumber: `ABCDE${i}${i}${i}${i}F`,
        aadharCardNumber: `1234${i}${i}${i}${i}5678`,
        bankName: 'Sample Bank',
        bankBranch: `Branch ${i}`,
        accountNumber: `1234567890${i}${i}`,
        ifscCode: `SBIN000${i}${i}${i}`,
        dateOfJoining: new Date(2023, i % 12, (i % 28) + 1),
        employeeRole: employeeRoles[i % employeeRoles.length],
        userId: employeeUser.id,
      },
    });
  }
  console.log('Created 10 sample employees');
}

async function main() {
  console.log('Start seeding...');

  // Clear existing data
  await prisma.team.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.user.deleteMany();

  await createSampleUsers();
  await createAdminUser();
  await createSampleEmployees();

  console.log('Seeding finished');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
