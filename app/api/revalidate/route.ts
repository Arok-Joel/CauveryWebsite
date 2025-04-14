import { NextResponse } from 'next/server';
import { revalidateTag, revalidatePath } from 'next/cache';
import { verifyAuth } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    // Check if the request is from an admin page or section
    const url = new URL(request.url);
    const referer = request.headers.get('referer') || '';
    const isFromAdminPage = referer.includes('/admin/');
    
    // Only check authentication for non-admin page requests
    if (!isFromAdminPage) {
      // Authentication - restrict to admin users
      const cookieStore = await cookies();
      const token = cookieStore.get('auth-token')?.value;
      
      if (!token) {
        return NextResponse.json(
          { error: 'Unauthorized - Authentication required' },
          { status: 401 }
        );
      }
      
      const verified = await verifyAuth(token);
      if (!verified || verified.role !== 'ADMIN') {
        // Only admin can revalidate manually
        return NextResponse.json(
          { error: 'Unauthorized - Admin access required' },
          { status: 401 }
        );
      }
    }

    // Get the tag from the URL
    const tag = url.searchParams.get('tag');
    
    if (!tag) {
      return NextResponse.json(
        { error: 'Missing tag parameter' },
        { status: 400 }
      );
    }

    // Handle special case for carousel images
    if (tag === 'carousel-images') {
      // Also revalidate the deletion tag to ensure full refresh
      revalidateTag('carousel-images-deleted');
      // Standard tag
      revalidateTag('carousel-images');
      // Also revalidate the homepage for good measure
      revalidatePath('/');
    } else if (tag === 'carousel-images-deleted') {
      // When deletion happens, revalidate both tags
      revalidateTag('carousel-images-deleted');
      setTimeout(() => {
        revalidateTag('carousel-images');
      }, 50);
      revalidatePath('/');
    } else {
      // For any other tag, just revalidate as normal
      revalidateTag(tag);
    }
    
    return NextResponse.json({
      revalidated: true,
      tag,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error revalidating tag:', error);
    return NextResponse.json(
      { error: 'Failed to revalidate content' },
      { status: 500 }
    );
  }
} 