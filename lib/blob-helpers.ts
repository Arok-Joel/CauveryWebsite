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
  return url.includes('.public.blob.vercel-storage.com');
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
    return imagePath;
  }
  
  // If it's already a blob URL, return it
  if (isBlobUrl(imagePath)) {
    return imagePath;
  }
  
  // If it's an external URL, return it
  if (imagePath.startsWith('http') && !imagePath.startsWith(window.location.origin)) {
    return imagePath;
  }
  
  try {
    // Check if this image has already been migrated to blob storage
    const response = await fetch(`/api/upload/get-url?path=${encodeURIComponent(imagePath)}`);
    
    if (!response.ok) {
      throw new Error('Failed to check blob URL');
    }
    
    const data = await response.json();
    
    // If we found a blob URL, use it
    if (data.isBlob && data.url) {
      return data.url;
    }
    
    // Otherwise, return the original path
    return imagePath;
  } catch (error) {
    console.error('Error checking blob URL:', error);
    // Return the original path if there was an error
    return imagePath;
  }
} 