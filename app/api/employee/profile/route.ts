import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth, decrypt } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    // Get auth token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized - No token' }, { status: 401 });
    }

    console.log('Token from cookie:', token);
    
    // Debug: Decode the token
    try {
      const decoded = await decrypt(token);
      console.log('Decoded token in profile route:', decoded);
    } catch (error) {
      console.error('Error decoding token:', error);
    }

    // Verify token
    const verified = await verifyAuth(token);
    console.log('Verification result:', verified);
    
    if (!verified) {
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }
    
    if (verified.role !== 'EMPLOYEE') {
      return NextResponse.json({ error: 'Unauthorized - Not an employee' }, { status: 401 });
    }

    // Get user and employee data
    const user = await db.user.findUnique({
      where: { email: verified.email },
      include: {
        employee: true,
      },
    });

    if (!user || !user.employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Use type assertion to handle the profileImage property
    const userData = user as unknown as {
      name: string;
      email: string;
      phone: string;
      address: string | null;
      pincode: string | null;
      profileImage: string | null;
      employee: {
        id: string;
        guardianName: string;
        dateOfBirth: Date;
        age: number;
        gender: string;
        pancardNumber: string;
        aadharCardNumber: string;
        bankName: string;
        bankBranch: string;
        accountNumber: string;
        ifscCode: string;
        dateOfJoining: Date;
        employeeRole: string;
      }
    };

    return NextResponse.json({
      user: {
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        address: userData.address || '',
        pincode: userData.pincode || '',
        profileImage: userData.profileImage,
      },
      employee: {
        guardianName: userData.employee.guardianName,
        dateOfBirth: userData.employee.dateOfBirth,
        age: userData.employee.age,
        gender: userData.employee.gender,
        pancardNumber: userData.employee.pancardNumber,
        aadharCardNumber: userData.employee.aadharCardNumber,
        bankName: userData.employee.bankName,
        bankBranch: userData.employee.bankBranch,
        accountNumber: userData.employee.accountNumber,
        ifscCode: userData.employee.ifscCode,
        dateOfJoining: userData.employee.dateOfJoining,
        employeeRole: userData.employee.employeeRole,
        id: userData.employee.id,
      },
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
