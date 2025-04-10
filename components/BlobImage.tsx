'use client';

import React, { useState, useEffect } from 'react';
import Image, { ImageProps } from 'next/image';
import { usePathname } from 'next/navigation';
import { getOrCreateBlobUrl } from '@/lib/blob-helpers';

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
  
  useEffect(() => {
    // Only use blob storage for the home page and if explicitly enabled
    if (useBlobStorage && pathname === '/') {
      const loadBlobUrl = async () => {
        try {
          setIsLoading(true);
          const blobUrl = await getOrCreateBlobUrl(src, pathname);
          setImageSrc(blobUrl);
        } catch (error) {
          console.error('Error loading blob URL:', error);
          // Fallback to original source
          setImageSrc(src);
        } finally {
          setIsLoading(false);
        }
      };
      
      loadBlobUrl();
    } else {
      setImageSrc(src);
      setIsLoading(false);
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
  
  return <Image src={imageSrc} {...props} />;
} 