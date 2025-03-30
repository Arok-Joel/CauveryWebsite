const { PrismaClient, UserRole, EmployeeRole } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const hashedPassword = bcrypt.hashSync('password123', 10);

const employeeRoles = [
  EmployeeRole.EXECUTIVE_DIRECTOR,
  EmployeeRole.DIRECTOR,
  EmployeeRole.JOINT_DIRECTOR,
  EmployeeRole.FIELD_OFFICER,
];

// Function to generate employee IDs in the format RCF + current year + sequence number
function generateEmployeeId(sequence) {
  const currentYear = new Date().getFullYear();
  return `RCF${currentYear}${sequence.toString().padStart(3, '0')}`;
}

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
  // Create employees with specific roles for proper hierarchy
  const employees = [];
  let sequence = 1;

  // Create 2 Executive Directors
  for (let i = 1; i <= 2; i++) {
    const employeeUser = await prisma.user.create({
      data: {
        name: `Executive Director ${i}`,
        email: `executive${i}@cauvery.com`,
        password: hashedPassword,
        phone: `9800${i}${i}${i}${i}${i}`,
        role: UserRole.EMPLOYEE,
      },
    });

    const employee = await prisma.employee.create({
      data: {
        id: generateEmployeeId(sequence++),
        guardianName: `Guardian ED${i}`,
        dateOfBirth: new Date(1975, i % 12, (i % 28) + 1),
        age: 45 + (i % 5),
        gender: i % 2 === 0 ? 'Male' : 'Female',
        pancardNumber: `EDPAN${i}${i}${i}${i}F`,
        aadharCardNumber: `9876${i}${i}${i}${i}5432`,
        bankName: 'State Bank of India',
        bankBranch: `Main Branch ${i}`,
        accountNumber: `9876543210${i}${i}`,
        ifscCode: `SBIN000${i}${i}${i}`,
        dateOfJoining: new Date(2020, i % 12, (i % 28) + 1),
        employeeRole: EmployeeRole.EXECUTIVE_DIRECTOR,
        userId: employeeUser.id,
      },
    });
    employees.push(employee);
  }

  console.log('Created sample employees with different roles');
  return employees;
}

async function main() {
  try {
    await createSampleUsers();
    await createAdminUser();
    const employees = await createSampleEmployees();
    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 