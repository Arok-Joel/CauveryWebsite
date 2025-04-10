import { NextResponse } from 'next/server';
import { list } from '@vercel/blob';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const imagePath = url.searchParams.get('path');
    
    if (!imagePath) {
      return NextResponse.json({ error: 'Image path is required' }, { status: 400 });
    }

    // Get the filename from the path
    const fileName = imagePath.split('/').pop();
    
    if (!fileName) {
      return NextResponse.json({ error: 'Invalid image path' }, { status: 400 });
    }

    // Get all existing blobs
    const { blobs } = await list();
    
    // Find a blob with a similar name (might have timestamp suffix)
    const matchingBlob = blobs.find(blob => {
      const blobName = blob.url.split('/').pop() || '';
      // Check if blob name starts with the file name (ignoring timestamp suffix)
      return blobName.startsWith(fileName.split('.')[0]);
    });
    
    if (matchingBlob) {
      return NextResponse.json({ 
        url: matchingBlob.url,
        isBlob: true,
        original: imagePath
      });
    }
    
    // No matching blob found
    return NextResponse.json({ 
      url: imagePath,
      isBlob: false,
      original: imagePath
    });
  } catch (error) {
    console.error('Error checking blob URL:', error);
    return NextResponse.json(
      { error: 'Failed to check blob URL', url: null },
      { status: 500 }
    );
  }
} 