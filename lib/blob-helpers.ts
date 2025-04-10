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
      const error = await response.json();
      console.error('Error uploading to blob:', error);
      return null;
    }
    
    const blob = await response.json();
    return blob.url;
  } catch (error) {
    console.error('Error uploading to blob:', error);
    return null;
  }
}

/**
 * Check if a URL is a Vercel Blob URL
 * @param url The URL to check
 * @returns True if the URL is a Vercel Blob URL
 */
export function isBlobUrl(url: string): boolean {
  return url.includes('.public.blob.vercel-storage.com');
}

/**
 * This function simply returns the original path without trying to upload
 * Use this for displaying images, not for migration
 * @param imagePath The current image path
 * @param pathname The current pathname
 */
export async function getOrCreateBlobUrl(imagePath: string, pathname: string = '/'): Promise<string> {
  // If we're not on the home page, return the original path
  if (pathname !== '/') {
    return imagePath;
  }
  
  // If it's already a blob URL, return it
  if (isBlobUrl(imagePath)) {
    return imagePath;
  }
  
  // For now, just return the original path
  // The actual migration should be done through the admin panel
  return imagePath;
} 