import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, message } = body;

    // Validate required fields
    if (!name || !email || !phone || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Create new contact message
    const contactMessage = await db.contactMessage.create({
      data: {
        name,
        email,
        phone,
        message,
        isRead: false
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully'
    });
  } catch (error) {
    console.error('Error saving contact message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
} 