import { db } from '@/lib/db';

// Generate a 6-digit OTP
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Store OTP in database with 10-minute expiry
export async function storeOTP(email: string, otp: string): Promise<void> {
  const expiryTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
  
  await db.user.update({
    where: { email },
    data: {
      otp,
      otpExpires: expiryTime,
    },
  });
}

// Verify OTP
export async function verifyOTP(email: string, otp: string): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { email },
    select: {
      otp: true,
      otpExpires: true,
    },
  });

  if (!user || !user.otp || !user.otpExpires) {
    return false;
  }

  // Check if OTP is expired
  if (user.otpExpires < new Date()) {
    // Clear expired OTP
    await db.user.update({
      where: { email },
      data: {
        otp: null,
        otpExpires: null,
      },
    });
    return false;
  }

  // Check if OTP matches
  if (user.otp !== otp) {
    return false;
  }

  // Clear used OTP
  await db.user.update({
    where: { email },
    data: {
      otp: null,
      otpExpires: null,
    },
  });

  return true;
} 