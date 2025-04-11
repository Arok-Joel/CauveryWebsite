import { NextResponse } from 'next/server';
import { list } from '@vercel/blob';
import { handleAuth } from '@/lib/auth-helpers';

export async function GET(request: Request) {
  try {
    // Optional: Check authentication
    // const session = await handleAuth(request);
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // Get the list of blobs
    const { blobs } = await list();
    
    // Filter to only include homepage images if needed
    // const filtered = blobs.filter(blob => blob.pathname === '/');

    return NextResponse.json({ blobs });
  } catch (error) {
    console.error('Error listing blobs:', error);
    return NextResponse.json(
      { error: 'Failed to list blobs' },
      { status: 500 }
    );
  }
} 