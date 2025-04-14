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
    // Use Next.js cache tag in the dynamic fetch
    const response = await fetch('https://api.vercel.com/v6/blobs?prefix=/', {
      headers: {
        Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
      },
      next: { 
        tags: ['carousel-images'],
        revalidate: 60  // Revalidate every 60 seconds
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch blobs');
    }
    
    const data = await response.json();
    const blobs = data.blobs || [];
    
    // Filter blobs to find carousel images (using prefix convention)
    const carouselBlobs = blobs.filter((blob: any) => {
      const fileName = blob.url.split('/').pop() || '';
      // Check if filename starts with 'carousel-'
      return fileName.toLowerCase().startsWith('carousel-');
    });
    
    // If we have carousel images in Blob storage, use those
    if (carouselBlobs.length > 0) {
      // Sort by upload date to get newest first
      const sortedBlobs = carouselBlobs.sort((a: any, b: any) => 
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      );
      
      return sortedBlobs.map((blob: any) => {
        // Extract name from filename for alt text
        const fileName = blob.url.split('/').pop() || '';
        const nameMatch = fileName.match(/carousel-(.+?)([-\d]*)\.[\w]+$/i);
        const name = nameMatch ? nameMatch[1].replace(/-/g, ' ') : 'Royal Cauvery Farms';
        
        return {
          url: blob.url,
          alt: `${name} - Royal Cauvery Farms`
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
 * Trigger revalidation of carousel images
 * Call this function after uploading a new carousel image
 */
export function revalidateCarouselImages() {
  revalidateTag('carousel-images');
} 