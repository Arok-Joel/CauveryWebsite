import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt } from '@/lib/jwt';
import { db } from '@/lib/db';
import { hash } from 'bcrypt';

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 401 }
      );
    }

    const payload = verifyJwt(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { email, password, type } = body;

    if (!email || !password || !type) {
      return NextResponse.json(
        { error: 'Email, password and type are required' },
        { status: 400 }
      );
    }

    // Verify the token matches the email and type
    if (payload.email !== email || payload.type !== type) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Hash the new password
    const hashedPassword = await hash(password, 10);

    // Find the user first
    const user = await db.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // For employees, verify they have an employee record
    if (type === 'EMPLOYEE') {
      const employee = await db.employee.findUnique({
        where: { userId: user.id }
      });

      if (!employee) {
        return NextResponse.json(
          { error: 'Employee record not found' },
          { status: 404 }
        );
      }
    }

    // Update the password
    await db.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    return NextResponse.json(
      { message: 'Password reset successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
} 