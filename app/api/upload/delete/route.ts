import { NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { handleAuth } from '@/lib/auth-helpers';

export async function DELETE(request: Request) {
  try {
    // Optional: Check authentication
    // const session = await handleAuth(request);
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Delete the blob
    await del(url);
    
    return NextResponse.json({ success: true, message: 'Blob deleted successfully' });
  } catch (error) {
    console.error('Error deleting blob:', error);
    return NextResponse.json(
      { error: 'Failed to delete blob' },
      { status: 500 }
    );
  }
} 