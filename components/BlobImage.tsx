'use client';

import React, { useState, useEffect } from 'react';
import Image, { ImageProps } from 'next/image';
import { usePathname } from 'next/navigation';
import { getOrCreateBlobUrl, isBlobUrl, fetchBlobForPath } from '@/lib/blob-helpers';

interface BlobImageProps extends Omit<ImageProps, 'src'> {
  src: string;
  useBlobStorage?: boolean;
}

export function BlobImage({ 
  src, 
  useBlobStorage = true, 
  ...props 
}: BlobImageProps) {
  const pathname = usePathname();
  const [imageSrc, setImageSrc] = useState<string>(src);
  const [isLoading, setIsLoading] = useState<boolean>(useBlobStorage);
  const [forceRegularImage, setForceRegularImage] = useState<boolean>(false);
  
  useEffect(() => {
    // Only use blob storage for the home page and if explicitly enabled
    if (useBlobStorage && pathname === '/') {
      const loadBlobUrl = async () => {
        try {
          setIsLoading(true);
          
          // First try to get a specific mapping for this image
          const blobUrl = await fetchBlobForPath(src);
          
          if (blobUrl) {
            console.log(`Using blob URL for ${src}: ${blobUrl}`);
            setImageSrc(blobUrl);
            setForceRegularImage(true);
          } else {
            // Fallback to original source
            setImageSrc(src);
            setForceRegularImage(false);
          }
        } catch (error) {
          console.error('Error loading blob URL:', error);
          // Fallback to original source
          setImageSrc(src);
          setForceRegularImage(false);
        } finally {
          setIsLoading(false);
        }
      };
      
      loadBlobUrl();
    } else {
      setImageSrc(src);
      setIsLoading(false);
      setForceRegularImage(false);
    }
  }, [src, pathname, useBlobStorage]);
  
  // Add a placeholder during loading
  if (isLoading) {
    return (
      <div 
        className={`bg-gray-200 animate-pulse ${props.className || ''}`}
        style={{ 
          width: props.width || '100%', 
          height: props.height || '100%',
          position: props.fill ? 'absolute' : 'relative',
          inset: props.fill ? 0 : undefined
        }}
      />
    );
  }
  
  // If it's a blob URL, use regular img tag to bypass Next.js Image optimization
  if (forceRegularImage || isBlobUrl(imageSrc)) {
    return (
      <img 
        src={imageSrc}
        alt={props.alt}
        className={props.className}
        style={{ 
          objectFit: props.objectFit as any || 'cover',
          objectPosition: props.objectPosition as any || 'center',
          width: props.fill ? '100%' : props.width,
          height: props.fill ? '100%' : props.height,
          position: props.fill ? 'absolute' : 'relative',
          inset: props.fill ? 0 : undefined
        }}
      />
    );
  }
  
  // Otherwise use Next.js Image
  return <Image src={imageSrc} {...props} />;
} 