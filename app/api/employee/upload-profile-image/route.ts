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

    // Parse the multipart form data
    const formData = await req.formData();
    const file = formData.get('profileImage') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 2MB' }, { status: 400 });
    }

    // Convert file to base64
    const fileBuffer = await file.arrayBuffer();
    const base64String = Buffer.from(fileBuffer).toString('base64');
    const imageUrl = `data:${file.type};base64,${base64String}`;

    // Update the user's profile image in the database
    await db.user.update({
      where: { email: verified.email },
      data: { profileImage: imageUrl },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Profile image uploaded successfully',
      imageUrl
    });
  } catch (error) {
    console.error('Profile image upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 