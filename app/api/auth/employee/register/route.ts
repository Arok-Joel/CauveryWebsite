import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as z from 'zod';
import bcrypt from 'bcryptjs';
import { generateEmployeeId } from '@/lib/employee-id';

const employeeRegisterSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().min(10),
  address: z.string().min(1),
  pincode: z.string().min(6),
  guardianName: z.string().min(2),
  dateOfBirth: z.string(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  pancardNumber: z.string(),
  aadharCardNumber: z.string(),
  bankName: z.string().min(2),
  bankBranch: z.string().min(2),
  accountNumber: z.string().min(9),
  ifscCode: z.string(),
  employeeRole: z.enum(['EXECUTIVE_DIRECTOR', 'DIRECTOR', 'JOINT_DIRECTOR', 'FIELD_OFFICER']),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = employeeRegisterSchema.parse(body);

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    // Check if PAN or Aadhar already exists
    const existingEmployee = await db.employee.findFirst({
      where: {
        OR: [{ pancardNumber: data.pancardNumber }, { aadharCardNumber: data.aadharCardNumber }],
      },
    });

    if (existingEmployee) {
      return NextResponse.json({ error: 'PAN or Aadhar card already registered' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Calculate age
    const dob = new Date(data.dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();

    // Create user and employee in a transaction
    const result = await db.$transaction(async tx => {
      // Create user
      const user = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: hashedPassword,
          phone: data.phone,
          address: data.address,
          pincode: data.pincode,
          role: 'EMPLOYEE',
        },
      });

      // Generate employee ID
      const employeeId = await generateEmployeeId();

      // Create employee
      const employee = await tx.employee.create({
        data: {
          id: employeeId,
          userId: user.id,
          guardianName: data.guardianName,
          dateOfBirth: dob,
          age: age,
          gender: data.gender,
          pancardNumber: data.pancardNumber,
          aadharCardNumber: data.aadharCardNumber,
          bankName: data.bankName,
          bankBranch: data.bankBranch,
          accountNumber: data.accountNumber,
          ifscCode: data.ifscCode,
          dateOfJoining: new Date(),
          employeeRole: data.employeeRole,
        },
      });

      return { user, employee };
    });

    return NextResponse.json({
      message: 'Employee registered successfully',
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        employeeId: result.employee.id,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error('Employee registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
