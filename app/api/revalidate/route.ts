import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { verifyAuth } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    // Authentication - restrict to admin users
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    if (token) {
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
    const url = new URL(request.url);
    const tag = url.searchParams.get('tag');
    
    if (!tag) {
      return NextResponse.json(
        { error: 'Missing tag parameter' },
        { status: 400 }
      );
    }

    // Revalidate the tag
    revalidateTag(tag);
    
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