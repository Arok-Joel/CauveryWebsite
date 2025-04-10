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

    // Get the basename (without extension) for better matching
    const baseName = fileName.includes('.') 
      ? fileName.substring(0, fileName.lastIndexOf('.')) 
      : fileName;
    
    // Get the extension for filtering
    const extension = fileName.includes('.') 
      ? fileName.split('.').pop()?.toLowerCase() 
      : '';

    console.log(`[API] Looking for blob with base name: ${baseName}, extension: ${extension}`);

    // Get all existing blobs
    const { blobs } = await list();
    
    console.log(`[API] Found ${blobs.length} total blobs`);
    
    // Find a blob with matching name pattern
    const matchingBlobs = blobs.filter(blob => {
      const blobName = blob.url.split('/').pop() || '';
      const blobBaseName = blobName.includes('.')
        ? blobName.substring(0, blobName.lastIndexOf('.'))
        : blobName;
      const blobExtension = blobName.includes('.')
        ? blobName.split('.').pop()?.toLowerCase()
        : '';
      
      // Check if:
      // 1. The blob name starts with the file's base name, OR
      // 2. The file's base name is found in the blob name (for timestamps)
      // 3. AND the extension matches if we have one
      const baseNameMatch = 
        blobBaseName.startsWith(baseName) || 
        blobBaseName.includes(baseName) ||
        blobBaseName.replace(/-\d+$/, '') === baseName;
        
      const extensionMatch = !extension || blobExtension === extension;
      
      return baseNameMatch && extensionMatch;
    });
    
    console.log(`[API] Found ${matchingBlobs.length} matching blobs`);
    
    if (matchingBlobs.length > 0) {
      // Sort by date (newest first) and take the first one
      matchingBlobs.sort((a, b) => 
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      );
      
      const matchedBlob = matchingBlobs[0];
      console.log(`[API] Using blob: ${matchedBlob.url}`);
      
      return NextResponse.json({ 
        url: matchedBlob.url,
        isBlob: true,
        original: imagePath,
        allMatches: matchingBlobs.map(b => ({ url: b.url, uploadedAt: b.uploadedAt }))
      });
    }
    
    // No matching blob found
    console.log(`[API] No matching blob found for ${imagePath}`);
    return NextResponse.json({ 
      url: imagePath,
      isBlob: false,
      original: imagePath
    });
  } catch (error) {
    console.error('[API] Error checking blob URL:', error);
    return NextResponse.json(
      { error: 'Failed to check blob URL', url: null },
      { status: 500 }
    );
  }
} 