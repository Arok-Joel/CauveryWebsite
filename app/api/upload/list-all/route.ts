import { NextResponse } from 'next/server';
import { list } from '@vercel/blob';

export async function GET(request: Request) {
  try {
    // Get all existing blobs
    const { blobs } = await list();
    
    // Return all blobs with their details
    return NextResponse.json({ 
      count: blobs.length,
      blobs: blobs.map(blob => ({
        url: blob.url,
        size: blob.size,
        uploadedAt: blob.uploadedAt
      }))
    });
  } catch (error) {
    console.error('Error listing all blobs:', error);
    return NextResponse.json(
      { error: 'Failed to list blobs' },
      { status: 500 }
    );
  }
} 