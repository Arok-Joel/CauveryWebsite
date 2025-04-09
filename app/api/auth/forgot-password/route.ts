import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as z from 'zod';
import { sendEmail } from '@/lib/email';
import { v4 as uuidv4 } from 'uuid';

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = forgotPasswordSchema.parse(body);

    // Find user by email
    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Return success even if user doesn't exist to prevent email enumeration
      return NextResponse.json({ 
        message: 'If an account exists with this email, you will receive a password reset link.' 
      });
    }

    // Generate reset token
    const resetToken = uuidv4();
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1); // Token expires in 1 hour

    // Store reset token in database
    await db.user.update({
      where: { email },
      data: {
        resetToken,
        resetExpires,
      } as any, // Type assertion to bypass TypeScript error
    });

    // Send reset email
    // Use the Vercel deployment URL if NEXT_PUBLIC_APP_URL is not set
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
      'https://cauvery-website-git-alph-bcf761-prabhakaran-s-projects-b5dd19f8.vercel.app';
    const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`;
    
    await sendEmail({
      to: email,
      subject: 'Password Reset Request - Royal Cauvery Farms',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <div style="background-color: #3C5A3E; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Royal Cauvery Farms</h1>
          </div>
          
          <div style="padding: 20px;">
            <h2 style="color: #3C5A3E; border-bottom: 2px solid #3C5A3E; padding-bottom: 10px;">Password Reset Request</h2>
            <p>Hello ${user.name},</p>
            <p>We received a request to reset your password. Click the button below to reset it:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #3C5A3E; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p>If you didn't request this, you can safely ignore this email.</p>
            <p>This link will expire in 1 hour.</p>
            <p>Best regards,<br>Royal Cauvery Farms Team</p>
          </div>
          
          <div style="background-color: #3C5A3E; color: white; padding: 15px; text-align: center; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Royal Cauvery Farms. All rights reserved.</p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ 
      message: 'If an account exists with this email, you will receive a password reset link.' 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 