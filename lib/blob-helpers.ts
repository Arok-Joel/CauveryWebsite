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
 * Convert a local image path to a Blob URL if needed
 * This function can be used to migrate existing images to Blob storage
 * @param imagePath The current image path
 * @param pathname The current pathname
 * @returns A promise that resolves to the Blob URL or the original path if conversion fails
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
  
  // If it's an external URL (not a local image), return it
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  try {
    // Fetch the local image and upload it to Blob storage
    const response = await fetch(imagePath);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${imagePath}`);
    }
    
    const blob = await response.blob();
    const file = new File([blob], imagePath.split('/').pop() || 'image.jpg', { type: blob.type });
    
    const blobUrl = await uploadToBlob(file, pathname);
    return blobUrl || imagePath;
  } catch (error) {
    console.error('Error converting to blob URL:', error);
    return imagePath;
  }
} 