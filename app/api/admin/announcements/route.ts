import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as z from 'zod';
import { verifyAuth } from '@/lib/auth';

const announcementSchema = z.object({
  title: z.string().min(2),
  content: z.string().min(10),
});

export async function POST(req: Request) {
  try {
    // Get admin token from cookies in headers
    const cookieHeader = req.headers.get('cookie');
    const token = cookieHeader
      ?.split(';')
      .find((c: string) => c.trim().startsWith('auth-token='))
      ?.split('=')[1];

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify token and get admin email
    const verified = await verifyAuth(token);
    if (!verified || verified.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get admin user from database
    const admin = await db.user.findFirst({
      where: {
        email: verified.email,
        role: 'ADMIN',
      },
    });

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    const body = await req.json();
    const { title, content } = announcementSchema.parse(body);

    const announcement = await db.announcement.create({
      data: {
        title,
        content,
        adminId: admin.id,
      },
      include: {
        admin: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json(announcement);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error('Announcement creation error:', error);
    return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const announcements = await db.announcement.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        admin: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json(announcements);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 });
  }
}
