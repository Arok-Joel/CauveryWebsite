import { NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { handleAuth } from '@/lib/auth-helpers';
import { revalidateTag } from 'next/cache';

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

    // Check if this is a carousel image by looking at the filename
    const fileName = url.split('/').pop() || '';
    const isCarouselImage = fileName.toLowerCase().startsWith('carousel-');

    // Delete the blob
    await del(url);
    
    // If a carousel image was deleted, revalidate with both tags
    if (isCarouselImage) {
      // First tag specifically for deletions
      revalidateTag('carousel-images-deleted');
      // Short delay to ensure proper cache invalidation sequence
      setTimeout(() => {
        // Then the standard tag
        revalidateTag('carousel-images');
      }, 50);
      
      console.log('Revalidated carousel images cache with deletion tags after deletion');
    }

    return NextResponse.json({ success: true, message: 'Blob deleted successfully' });
  } catch (error) {
    console.error('Error deleting blob:', error);
    return NextResponse.json(
      { error: 'Failed to delete blob' },
      { status: 500 }
    );
  }
} 