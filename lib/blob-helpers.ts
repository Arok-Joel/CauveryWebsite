/**
 * Helper functions for working with Vercel Blob Storage
 */

/**
 * Upload a file to Vercel Blob Storage
 * @param file The file to upload
 * @param pathname The current pathname (used to restrict uploads to specific routes)
 * @returns The blob URL if successful, null if failed
 */
export async function uploadToBlob(file: File, pathname: string = '/'): Promise<string | null> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('pathname', pathname);
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      
      // Handle specific error cases
      if (response.status === 409) {
        const error = new Error(errorData.error || 'This image already exists. Please try a different image or rename it.');
        // Add existing images to the error object if available
        if (errorData.existingImages) {
          (error as any).existingImages = errorData.existingImages;
        }
        // Don't log this as an error since it's an expected condition
        (error as any).expected = true;
        throw error;
      } else if (response.status === 400) {
        throw new Error(errorData.error || 'Invalid file. Please check the file and try again.');
      } else if (response.status === 403) {
        throw new Error(errorData.error || 'You are not allowed to upload to this location.');
      } else {
        throw new Error(errorData.error || 'Failed to upload image. Please try again later.');
      }
    }
    
    const blob = await response.json();
    return blob.url;
  } catch (error) {
    if (error instanceof Error) {
      // Only log unexpected errors to console
      if (!(error as any).expected) {
        console.error('Error uploading to blob:', error.message);
      }
      throw error; // Let the component handle the specific error
    } else {
      console.error('Error uploading to blob:', error);
      throw new Error('Failed to upload image. Please try again later.');
    }
  }
}

/**
 * Check if a URL is a Vercel Blob URL
 * @param url The URL to check
 * @returns True if the URL is a Vercel Blob URL
 */
export function isBlobUrl(url: string): boolean {
  return typeof url === 'string' && url.includes('.public.blob.vercel-storage.com');
}

/**
 * Get the filename from a path
 * @param path The path to extract filename from
 */
function getFilenameFromPath(path: string): string {
  return path.split('/').pop() || path;
}

/**
 * Get the base filename without extension
 * @param filename The filename to get base name from
 */
function getBasename(filename: string): string {
  return filename.includes('.') 
    ? filename.substring(0, filename.lastIndexOf('.'))
    : filename;
}

/**
 * Get the direct URL of a blob by its filename
 * This function fetches all blobs and finds one with a matching filename
 */
export async function getDirectBlobUrl(filename: string): Promise<string | null> {
  try {
    // Get a list of all blobs
    const response = await fetch('/api/upload/list-all');
    if (!response.ok) {
      throw new Error('Failed to fetch blob list');
    }
    
    const data = await response.json();
    const blobs: Array<{url: string; size: number; uploadedAt: string}> = data.blobs || [];
    
    // Get base name for matching
    const baseName = filename.includes('.')
      ? filename.substring(0, filename.lastIndexOf('.'))
      : filename;
    
    // Find matching blobs
    const matchingBlobs = blobs.filter(blob => {
      const blobName = blob.url.split('/').pop() || '';
      const blobBaseName = blobName.includes('.')
        ? blobName.substring(0, blobName.lastIndexOf('.'))
        : blobName;
      
      return blobBaseName.includes(baseName) || 
             blobBaseName.startsWith(baseName) || 
             baseName.includes(blobBaseName);
    });
    
    if (matchingBlobs.length > 0) {
      // Sort by date and take the newest
      matchingBlobs.sort((a, b) => 
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      );
      return matchingBlobs[0].url;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting direct blob URL:', error);
    return null;
  }
}

/**
 * This function checks if a local image has already been migrated to Blob storage
 * and returns the Blob URL if available
 * @param imagePath The current image path
 * @param pathname The current pathname
 */
export async function getOrCreateBlobUrl(imagePath: string, pathname: string = '/'): Promise<string> {
  // If we're not on the home page, return the original path
  if (pathname !== '/') {
    console.log(`[getOrCreateBlobUrl] Not on homepage, using original: ${imagePath}`);
    return imagePath;
  }
  
  // If it's already a blob URL, return it
  if (isBlobUrl(imagePath)) {
    console.log(`[getOrCreateBlobUrl] Already a blob URL: ${imagePath}`);
    return imagePath;
  }
  
  // If it's an external URL, return it
  if (imagePath.startsWith('http') && !imagePath.startsWith(window.location.origin)) {
    console.log(`[getOrCreateBlobUrl] External URL, using original: ${imagePath}`);
    return imagePath;
  }
  
  try {
    console.log(`[getOrCreateBlobUrl] Checking if ${imagePath} has a blob URL`);
    
    // Get the filename from the path
    const filename = getFilenameFromPath(imagePath);
    
    // First try to get a direct URL match from our blobs
    const directUrl = await getDirectBlobUrl(filename);
    if (directUrl) {
      console.log(`[getOrCreateBlobUrl] Found direct blob URL: ${directUrl}`);
      return directUrl;
    }
    
    // If that fails, try our API endpoint
    const response = await fetch(`/api/upload/get-url?path=${encodeURIComponent(imagePath)}`);
    
    if (!response.ok) {
      console.error(`[getOrCreateBlobUrl] API error: ${response.status}`);
      throw new Error('Failed to check blob URL');
    }
    
    const data = await response.json();
    console.log(`[getOrCreateBlobUrl] API response:`, data);
    
    // If we found a blob URL, use it
    if (data.isBlob && data.url) {
      console.log(`[getOrCreateBlobUrl] Found blob URL: ${data.url}`);
      return data.url;
    }
    
    // Otherwise, return the original path
    console.log(`[getOrCreateBlobUrl] No blob URL found, using original: ${imagePath}`);
    return imagePath;
  } catch (error) {
    console.error('[getOrCreateBlobUrl] Error checking blob URL:', error);
    // Return the original path if there was an error
    return imagePath;
  }
} 