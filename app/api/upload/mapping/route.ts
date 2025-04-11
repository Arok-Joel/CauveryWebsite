import { NextResponse } from 'next/server';
import { list } from '@vercel/blob';
import { handleAuth } from '@/lib/auth-helpers';

export async function GET(request: Request) {
  try {
    // Get the path parameter if provided
    const url = new URL(request.url);
    const path = url.searchParams.get('path');
    
    // Get all blobs
    const { blobs } = await list();
    
    if (path) {
      // If path is provided, look for a specific blob
      const fileName = path.split('/').pop() || '';
      const baseFileName = fileName.includes('.')
        ? fileName.substring(0, fileName.lastIndexOf('.'))
        : fileName;
      
      // Find matching blobs
      const matchingBlobs = blobs.filter(blob => {
        const blobFileName = blob.url.split('/').pop() || '';
        const blobBaseFileName = blobFileName.replace(/-\d+\.\w+$/, '');
        
        // Match by exact filename or base filename
        return blobFileName === fileName || 
               blobBaseFileName === baseFileName ||
               blobBaseFileName === fileName;
      });
      
      if (matchingBlobs.length > 0) {
        // Return the most recent matching blob
        const sortedBlobs = matchingBlobs.sort((a, b) => 
          new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
        );
        
        return NextResponse.json({ 
          found: true,
          localPath: path,
          blobUrl: sortedBlobs[0].url
        });
      } else {
        return NextResponse.json({ found: false, localPath: path });
      }
    }
    
    // If no path provided, return all mappings
    const mappings: Record<string, string> = {};
    
    blobs.forEach(blob => {
      const fileName = blob.url.split('/').pop() || '';
      if (fileName) {
        // Get base name without timestamp
        const baseFileName = fileName.replace(/-\d+\.\w+$/, '');
        const ext = fileName.includes('.') ? fileName.split('.').pop() : '';
        
        // Add mappings for different extensions
        mappings[`/${baseFileName}.jpg`] = blob.url;
        mappings[`/${baseFileName}.jpeg`] = blob.url;
        mappings[`/${baseFileName}.png`] = blob.url;
        mappings[`/${baseFileName}.webp`] = blob.url;
        
        // Also add direct mapping
        if (ext) {
          mappings[`/${baseFileName}.${ext}`] = blob.url;
        }
      }
    });
    
    return NextResponse.json({ mappings });
  } catch (error) {
    console.error('Error getting blob mappings:', error);
    return NextResponse.json(
      { error: 'Failed to get blob mappings' },
      { status: 500 }
    );
  }
} 