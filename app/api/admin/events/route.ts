import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as z from 'zod';
import { verifyAuth } from '@/lib/auth';

const eventSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(10),
  date: z.string().optional().nullable(),
  location: z.string().optional(),
  images: z.array(z.string()).default([]),
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

    // Verify token and check admin role
    const verified = await verifyAuth(token);
    if (!verified || verified.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, date, location, images } = eventSchema.parse(body);

    // Create the event - use undefined instead of null for date to allow Prisma to use the schema default
    const event = await db.event.create({
      data: {
        title,
        description,
        date: date ? new Date(date) : undefined,
        location,
        images,
        imageUrl: images.length > 0 ? images[0] : undefined,
      },
    });

    return NextResponse.json(event);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error('Event creation error:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const events = await db.event.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
} 