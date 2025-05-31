import prisma from '@/lib/prisma';
import { list } from '@vercel/blob';
import { revalidateTag } from 'next/cache';

export interface CarouselImage {
  url: string;
  alt: string;
}

/**
 * Fetch all carousel images for the home page
 * Prioritizes Vercel Blob storage images with carousel- prefix
 */
export async function fetchCarouselImages(): Promise<CarouselImage[]> {
  try {
    // Use the Vercel Blob SDK's list function
    const { blobs } = await list();
    
    // Filter blobs to find carousel images (using prefix convention)
    const carouselBlobs = blobs.filter(blob => {
      const fileName = blob.url.split('/').pop() || '';
      // Check if filename starts with 'carousel-'
      return fileName.toLowerCase().startsWith('carousel-');
    });
    
    // If we have carousel images in Blob storage, use those
    if (carouselBlobs.length > 0) {
      // Sort by upload date to get newest first
      const sortedBlobs = carouselBlobs.sort((a, b) => 
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      );
      
      return sortedBlobs.map(blob => {
        // Extract name from filename for alt text
        const fileName = blob.url.split('/').pop() || '';
        const nameMatch = fileName.match(/carousel-(.+?)([-\d]*)\.[\w]+$/i);
        const name = nameMatch ? nameMatch[1].replace(/-/g, ' ') : 'Nilam';
        
        return {
          url: blob.url,
          alt: `${name} - Nilam`
        };
      });
    }
    
    // If no carousel images in Blob storage, return an empty array
    // The default image will be added in the Home component
    return [];
  } catch (error) {
    console.error('Error fetching carousel images:', error);
    // Return empty array on error, default image will be used
    return [];
  }
}

/**
 * Trigger revalidation of carousel images after adding a new image
 */
export function revalidateCarouselImages() {
  revalidateTag('carousel-images');
}

/**
 * Trigger revalidation of carousel images after deleting an image
 * This uses a separate tag to ensure deletion is properly handled
 */
export function revalidateCarouselImagesAfterDeletion() {
  revalidateTag('carousel-images-deleted');
  // Also update the main tag to ensure consistency
  revalidateTag('carousel-images');
} 