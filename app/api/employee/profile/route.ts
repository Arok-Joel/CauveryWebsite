import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    // Get auth token from cookies in headers
    const cookieHeader = req.headers.get('cookie');
    const token = cookieHeader
      ?.split(';')
      .find((c: string) => c.trim().startsWith('auth-token='))
      ?.split('=')[1];

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify token
    const verified = await verifyAuth(token);
    if (!verified || verified.role !== 'EMPLOYEE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user and employee data
    const user = await db.user.findUnique({
      where: { email: verified.email },
      select: {
        name: true,
        email: true,
        phone: true,
        address: true,
        pincode: true,
        employee: {
          select: {
            guardianName: true,
            dateOfBirth: true,
            age: true,
            gender: true,
            pancardNumber: true,
            aadharCardNumber: true,
            bankName: true,
            bankBranch: true,
            accountNumber: true,
            ifscCode: true,
            dateOfJoining: true,
            employeeRole: true,
          },
        },
      },
    });

    if (!user || !user.employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        pincode: user.pincode,
      },
      employee: user.employee,
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
