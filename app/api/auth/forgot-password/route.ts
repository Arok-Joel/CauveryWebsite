import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as z from 'zod';
import { generateOTP } from '@/lib/otp';
import { sendEmail } from '@/lib/email';

const forgotPasswordSchema = z.object({
  email: z.string().email(),
  type: z.enum(['USER', 'EMPLOYEE']),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, type } = forgotPasswordSchema.parse(body);

    // Check if user exists
    const user = await db.user.findFirst({
      where: {
        email,
        role: type === 'EMPLOYEE' ? 'EMPLOYEE' : 'USER',
      },
      include: type === 'EMPLOYEE' ? {
        employee: true,
      } : undefined,
    });

    if (!user) {
      return NextResponse.json(
        { error: 'No account found with this email' },
        { status: 404 }
      );
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Store OTP in database
    await db.user.update({
      where: { email },
      data: {
        otp,
        otpExpires,
      },
    });

    // Send OTP email
    const emailTemplate = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="background-color: #3C5A3E; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Royal Cauvery Farms</h1>
        </div>
        
        <div style="padding: 20px;">
          <h2 style="color: #3C5A3E; border-bottom: 2px solid #3C5A3E; padding-bottom: 10px;">Password Reset Request</h2>
          <p>Dear ${user.name},</p>
          <p>We received a request to reset your password. Your OTP is:</p>
          
          <div style="background-color: #3C5A3E; color: white; padding: 15px; text-align: center; margin: 20px 0; border-radius: 5px;">
            <h2 style="margin: 0; font-size: 24px;">${otp}</h2>
          </div>
          
          <p>This OTP will expire in 10 minutes.</p>
          <p>If you didn't request this password reset, please ignore this email.</p>
          
          <p>Best regards,<br>Royal Cauvery Farms Team</p>
        </div>
        
        <div style="background-color: #3C5A3E; color: white; padding: 15px; text-align: center; font-size: 12px;">
          <p>© ${new Date().getFullYear()} Royal Cauvery Farms. All rights reserved.</p>
        </div>
      </div>
    `;

    await sendEmail({
      to: email,
      subject: 'Password Reset OTP - Royal Cauvery Farms',
      html: emailTemplate,
    });

    return NextResponse.json({
      message: 'OTP sent successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
} 