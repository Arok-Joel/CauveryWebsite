import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { handleAuth } from '@/lib/auth-helpers';

export async function POST(request: Request) {
  try {
    // Optional: Check authentication if needed
    // const session = await handleAuth(request);
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type if needed
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    // Get pathname from formData if provided, default to root
    const pathname = (formData.get('pathname') as string) || '/';
    
    // Only allow uploads for the home page for now
    if (pathname !== '/') {
      return NextResponse.json({ error: 'Blob storage is only enabled for the home page' }, { status: 403 });
    }

    // Upload to Vercel Blob
    const blob = await put(file.name, file, {
      access: 'public',
    });

    return NextResponse.json(blob);
  } catch (error) {
    console.error('Error uploading to Vercel Blob:', error);
    return NextResponse.json(
      { error: 'Error uploading file' },
      { status: 500 }
    );
  }
} 