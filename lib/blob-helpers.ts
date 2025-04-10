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
  return url?.includes?.('.public.blob.vercel-storage.com') || false;
}

// Store known mappings from local paths to blob URLs
// This can be populated from the API when needed
const blobCache: Record<string, string> = {};

// Function to fetch all blobs and update the cache
export async function fetchBlobMappings(): Promise<Record<string, string>> {
  try {
    const response = await fetch('/api/upload/mapping');
    if (!response.ok) {
      throw new Error('Failed to fetch blob mappings');
    }
    
    const data = await response.json();
    
    // Update cache with the mappings from the API
    if (data.mappings) {
      Object.assign(blobCache, data.mappings);
    }
    
    return data.mappings || {};
  } catch (error) {
    console.error('Error fetching blob mappings:', error);
    return {};
  }
}

// Function to get a specific blob URL mapping
export async function fetchBlobForPath(path: string): Promise<string | null> {
  try {
    const response = await fetch(`/api/upload/mapping?path=${encodeURIComponent(path)}`);
    if (!response.ok) {
      throw new Error('Failed to fetch blob mapping');
    }
    
    const data = await response.json();
    
    if (data.found && data.blobUrl) {
      // Update cache
      blobCache[path] = data.blobUrl;
      return data.blobUrl;
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching blob for path ${path}:`, error);
    return null;
  }
}

// Initialize the cache when module loads
if (typeof window !== 'undefined') {
  fetchBlobMappings().catch(console.error);
}

/**
 * Get the blob URL for an image if it exists
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
  
  // If we already have a mapping in the cache, use it
  if (blobCache[imagePath]) {
    return blobCache[imagePath];
  }
  
  // If not in cache, try to fetch the specific mapping
  try {
    const blobUrl = await fetchBlobForPath(imagePath);
    if (blobUrl) {
      return blobUrl;
    }
  } catch (error) {
    console.error('Error getting blob URL for path:', error);
  }
  
  // Return original path if no blob URL found
  return imagePath;
} 