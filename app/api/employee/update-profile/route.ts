import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function POST(req: Request) {
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

    // Get request body
    const { section, field, value } = await req.json();

    // Validate input
    if (!section || !field || value === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate section
    if (section !== 'user' && section !== 'employee') {
      return NextResponse.json(
        { error: 'Invalid section' },
        { status: 400 }
      );
    }

    // Get the user
    const user = await db.user.findUnique({
      where: { email: verified.email },
      include: { employee: true },
    });

    if (!user || !user.employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Define fields that can be updated for each section
    const allowedUserFields = ['name', 'phone', 'address', 'pincode'];
    const allowedEmployeeFields = [
      'guardianName', 
      'pancardNumber', 
      'aadharCardNumber', 
      'bankName', 
      'bankBranch', 
      'accountNumber', 
      'ifscCode'
    ];

    // Check if the field is allowed to be updated
    if (
      (section === 'user' && !allowedUserFields.includes(field)) ||
      (section === 'employee' && !allowedEmployeeFields.includes(field))
    ) {
      return NextResponse.json(
        { error: 'Field cannot be updated' },
        { status: 400 }
      );
    }

    // Update the appropriate section
    if (section === 'user') {
      await db.user.update({
        where: { id: user.id },
        data: { [field]: value },
      });
    } else {
      await db.employee.update({
        where: { id: user.employee.id },
        data: { [field]: value },
      });
    }

    return NextResponse.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 