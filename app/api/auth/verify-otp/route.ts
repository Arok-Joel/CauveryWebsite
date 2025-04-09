import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as z from 'zod';
import { SignJWT } from 'jose';

const verifyOTPSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
  type: z.enum(['USER', 'EMPLOYEE']),
});

const secretKey = process.env.JWT_SECRET || 'fallback-secret-key';
const key = new TextEncoder().encode(secretKey);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, otp, type } = verifyOTPSchema.parse(body);

    // Find user and verify OTP
    const user = await db.user.findFirst({
      where: {
        email,
        role: type === 'EMPLOYEE' ? 'EMPLOYEE' : 'USER',
        otp,
        otpExpires: {
          gt: new Date(), // OTP should not be expired
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }

    // Generate a short-lived token for password reset
    const token = await new SignJWT({
      email: user.email,
      type,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('5m') // Token expires in 5 minutes
      .sign(key);

    return NextResponse.json({
      message: 'OTP verified successfully',
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error('OTP verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify OTP' },
      { status: 500 }
    );
  }
} 