'use client';

import React, { useState, useEffect } from 'react';
import Image, { ImageProps } from 'next/image';
import { usePathname } from 'next/navigation';
import { getOrCreateBlobUrl, isBlobUrl } from '@/lib/blob-helpers';

interface BlobImageProps extends Omit<ImageProps, 'src'> {
  src: string;
  useBlobStorage?: boolean;
  showDebug?: boolean;
}

export function BlobImage({ 
  src, 
  useBlobStorage = true,
  showDebug = process.env.NODE_ENV === 'development',
  ...props 
}: BlobImageProps) {
  const pathname = usePathname();
  const [imageSrc, setImageSrc] = useState<string>(src);
  const [isLoading, setIsLoading] = useState<boolean>(useBlobStorage);
  const [imageInfo, setImageInfo] = useState<{
    isBlob: boolean;
    original: string;
  }>({
    isBlob: isBlobUrl(src),
    original: src
  });
  
  useEffect(() => {
    // Only use blob storage for the home page and if explicitly enabled
    if (useBlobStorage && pathname === '/') {
      const loadBlobUrl = async () => {
        try {
          setIsLoading(true);
          const blobUrl = await getOrCreateBlobUrl(src, pathname);
          setImageSrc(blobUrl);
          setImageInfo({
            isBlob: isBlobUrl(blobUrl),
            original: src
          });
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
  
  return (
    <div className="relative">
      <Image src={imageSrc} {...props} />
      
      {/* Debug overlay - only shown in development mode by default */}
      {showDebug && (
        <div className="absolute top-0 left-0 bg-black/70 text-white text-xs p-1 max-w-full overflow-hidden z-50">
          <div>
            <span className="font-bold mr-1">Source:</span>
            <span className={imageInfo.isBlob ? "text-green-400" : "text-yellow-400"}>
              {imageInfo.isBlob ? 'Blob Storage' : 'Local File'}
            </span>
          </div>
          <div className="truncate" title={imageSrc}>
            <span className="font-bold mr-1">Path:</span>
            <span className="opacity-80">
              {imageInfo.isBlob 
                ? imageSrc.substring(0, 20) + '...' 
                : imageSrc}
            </span>
          </div>
          {imageInfo.isBlob && (
            <div className="truncate" title={imageInfo.original}>
              <span className="font-bold mr-1">Original:</span>
              <span className="opacity-80">{imageInfo.original}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 