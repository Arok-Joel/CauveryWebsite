import { PrismaClient, UserRole, EmployeeRole, Employee } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const hashedPassword = bcrypt.hashSync('password123', 10);

const employeeRoles = [
  EmployeeRole.EXECUTIVE_DIRECTOR,
  EmployeeRole.DIRECTOR,
  EmployeeRole.JOINT_DIRECTOR,
  EmployeeRole.FIELD_OFFICER,
];

// Function to generate employee IDs in the format RCF + current year + sequence number
function generateEmployeeId(sequence: number): string {
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

async function createSampleEmployees(): Promise<Employee[]> {
  // Create employees with specific roles for proper hierarchy
  const employees: Employee[] = [];
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

  // Create 3 Directors
  for (let i = 1; i <= 3; i++) {
    const employeeUser = await prisma.user.create({
      data: {
        name: `Director ${i}`,
        email: `director${i}@cauvery.com`,
        password: hashedPassword,
        phone: `9810${i}${i}${i}${i}${i}`,
        role: UserRole.EMPLOYEE,
      },
    });

    const employee = await prisma.employee.create({
      data: {
        id: generateEmployeeId(sequence++),
        guardianName: `Guardian D${i}`,
        dateOfBirth: new Date(1980, i % 12, (i % 28) + 1),
        age: 40 + (i % 5),
        gender: i % 2 === 0 ? 'Male' : 'Female',
        pancardNumber: `DIRPAN${i}${i}${i}${i}F`,
        aadharCardNumber: `8765${i}${i}${i}${i}4321`,
        bankName: 'HDFC Bank',
        bankBranch: `Branch D${i}`,
        accountNumber: `8765432109${i}${i}`,
        ifscCode: `HDFC000${i}${i}${i}`,
        dateOfJoining: new Date(2021, i % 12, (i % 28) + 1),
        employeeRole: EmployeeRole.DIRECTOR,
        userId: employeeUser.id,
      },
    });
    employees.push(employee);
  }

  // Create 5 Joint Directors
  for (let i = 1; i <= 5; i++) {
    const employeeUser = await prisma.user.create({
      data: {
        name: `Joint Director ${i}`,
        email: `jointdirector${i}@cauvery.com`,
        password: hashedPassword,
        phone: `9820${i}${i}${i}${i}${i}`,
        role: UserRole.EMPLOYEE,
      },
    });

    const employee = await prisma.employee.create({
      data: {
        id: generateEmployeeId(sequence++),
        guardianName: `Guardian JD${i}`,
        dateOfBirth: new Date(1985, i % 12, (i % 28) + 1),
        age: 35 + (i % 5),
        gender: i % 2 === 0 ? 'Male' : 'Female',
        pancardNumber: `JDPAN${i}${i}${i}${i}F`,
        aadharCardNumber: `7654${i}${i}${i}${i}3210`,
        bankName: 'ICICI Bank',
        bankBranch: `Branch JD${i}`,
        accountNumber: `7654321098${i}${i}`,
        ifscCode: `ICICI00${i}${i}${i}`,
        dateOfJoining: new Date(2022, i % 12, (i % 28) + 1),
        employeeRole: EmployeeRole.JOINT_DIRECTOR,
        userId: employeeUser.id,
      },
    });
    employees.push(employee);
  }

  // Create 10 Field Officers
  for (let i = 1; i <= 10; i++) {
    const employeeUser = await prisma.user.create({
      data: {
        name: `Field Officer ${i}`,
        email: `fieldofficer${i}@cauvery.com`,
        password: hashedPassword,
        phone: `9830${i}${i}${i}${i}${i}`,
        role: UserRole.EMPLOYEE,
      },
    });

    const employee = await prisma.employee.create({
      data: {
        id: generateEmployeeId(sequence++),
        guardianName: `Guardian FO${i}`,
        dateOfBirth: new Date(1990, i % 12, (i % 28) + 1),
        age: 30 + (i % 5),
        gender: i % 2 === 0 ? 'Male' : 'Female',
        pancardNumber: `FOPAN${i}${i}${i}${i}F`,
        aadharCardNumber: `6543${i}${i}${i}${i}2109`,
        bankName: 'Axis Bank',
        bankBranch: `Branch FO${i}`,
        accountNumber: `6543210987${i}${i}`,
        ifscCode: `AXIS00${i}${i}${i}`,
        dateOfJoining: new Date(2023, i % 12, (i % 28) + 1),
        employeeRole: EmployeeRole.FIELD_OFFICER,
        userId: employeeUser.id,
      },
    });
    employees.push(employee);
  }

  console.log('Created sample employees with different roles');
  return employees;
}

async function createTeamsWithHierarchy(employees: Employee[]) {
  // Get employees by role
  const executiveDirectors = employees.filter(e => e.employeeRole === EmployeeRole.EXECUTIVE_DIRECTOR);
  const directors = employees.filter(e => e.employeeRole === EmployeeRole.DIRECTOR);
  const jointDirectors = employees.filter(e => e.employeeRole === EmployeeRole.JOINT_DIRECTOR);
  const fieldOfficers = employees.filter(e => e.employeeRole === EmployeeRole.FIELD_OFFICER);

  // Create teams led by Executive Directors
  for (let i = 0; i < executiveDirectors.length; i++) {
    const team = await prisma.team.create({
      data: {
        leaderId: executiveDirectors[i].id,
      },
    });

    // Assign directors to teams and set reporting relationships
    const directorsPerTeam = Math.ceil(directors.length / executiveDirectors.length);
    const teamDirectors = directors.slice(i * directorsPerTeam, (i + 1) * directorsPerTeam);
    
    for (const director of teamDirectors) {
      // Update director to be part of the team and report to the executive director
      await prisma.employee.update({
        where: { id: director.id },
        data: {
          teamId: team.id,
          reportsToId: executiveDirectors[i].id,
        },
      });

      // Assign joint directors to directors
      const jointDirectorsPerDirector = Math.ceil(jointDirectors.length / directors.length);
      const startIndex = directors.indexOf(director) * jointDirectorsPerDirector;
      const directorJointDirectors = jointDirectors.slice(startIndex, startIndex + jointDirectorsPerDirector);
      
      for (const jointDirector of directorJointDirectors) {
        if (jointDirector) {
          // Update joint director to be part of the team and report to the director
          await prisma.employee.update({
            where: { id: jointDirector.id },
            data: {
              teamId: team.id,
              reportsToId: director.id,
            },
          });

          // Assign field officers to joint directors
          const fieldOfficersPerJointDirector = Math.ceil(fieldOfficers.length / jointDirectors.length);
          const foStartIndex = jointDirectors.indexOf(jointDirector) * fieldOfficersPerJointDirector;
          const jointDirectorFieldOfficers = fieldOfficers.slice(foStartIndex, foStartIndex + fieldOfficersPerJointDirector);
          
          for (const fieldOfficer of jointDirectorFieldOfficers) {
            if (fieldOfficer) {
              // Update field officer to be part of the team and report to the joint director
              await prisma.employee.update({
                where: { id: fieldOfficer.id },
                data: {
                  teamId: team.id,
                  reportsToId: jointDirector.id,
                },
              });
            }
          }
        }
      }
    }
  }

  console.log('Created teams with proper reporting hierarchy');
}

async function main() {
  console.log('Start seeding...');

  // Clear existing data
  await prisma.team.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.user.deleteMany();

  await createSampleUsers();
  await createAdminUser();
  const employees = await createSampleEmployees();
  await createTeamsWithHierarchy(employees);

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
