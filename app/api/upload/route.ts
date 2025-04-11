import { NextResponse } from 'next/server';
import { put, list } from '@vercel/blob';
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

    // Check if file with same name already exists (excluding timestamp)
    const originalName = file.name;
    const baseFileName = originalName.includes('.') 
      ? originalName.substring(0, originalName.lastIndexOf('.'))
      : originalName;
    
    // Get all existing blobs
    const { blobs } = await list();
    
    // Check if any existing blob matches this file name pattern
    const similarBlobs = blobs.filter(blob => {
      const blobName = blob.url.split('/').pop() || '';
      return blobName.startsWith(baseFileName) || 
             blobName.replace(/-\d+\.\w+$/, '') === baseFileName;
    });
    
    if (similarBlobs.length > 0) {
      return NextResponse.json(
        { 
          error: 'A similar image already exists',
          existingImages: similarBlobs.map(blob => ({
            url: blob.url,
            uploadedAt: blob.uploadedAt 
          }))
        }, 
        { status: 409 }
      );
    }

    // Add timestamp to filename to avoid conflicts
    const timestamp = Date.now();
    const fileExt = originalName.includes('.') ? originalName.split('.').pop() : '';
    const baseName = originalName.includes('.') ? originalName.substring(0, originalName.lastIndexOf('.')) : originalName;
    const uniqueFilename = `${baseName}-${timestamp}.${fileExt}`;

    try {
      // Upload to Vercel Blob with unique filename
      const blob = await put(uniqueFilename, file, {
        access: 'public',
      });
      
      return NextResponse.json(blob);
    } catch (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload image. Please try again.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error uploading to Vercel Blob:', error);
    return NextResponse.json(
      { error: 'Error uploading file. Please try again later.' },
      { status: 500 }
    );
  }
} 