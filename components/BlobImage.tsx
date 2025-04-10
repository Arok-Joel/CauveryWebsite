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
    error?: string;
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
          console.log(`[BlobImage] Original: ${src}, Resolved: ${blobUrl}, isBlob: ${isBlobUrl(blobUrl)}`);
          
          setImageSrc(blobUrl);
          setImageInfo({
            isBlob: isBlobUrl(blobUrl),
            original: src
          });
        } catch (error) {
          console.error('Error loading blob URL:', error);
          // Fallback to original source
          setImageSrc(src);
          setImageInfo({
            isBlob: false,
            original: src,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
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
  
  // For blob URLs, we need to directly use the URL without Next.js image optimization
  if (isBlobUrl(imageSrc)) {
    return (
      <div className="relative">
        {/* We completely bypass Next.js Image component for blob URLs to avoid optimization issues */}
        <div
          className={props.className || ''}
          style={{
            position: props.fill ? 'absolute' : 'relative',
            width: props.width || '100%',
            height: props.height || '100%', 
            inset: props.fill ? 0 : undefined,
            backgroundImage: `url(${imageSrc})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        
        {/* Debug overlay */}
        {showDebug && (
          <div className="absolute top-0 left-0 bg-black/70 text-white text-xs p-1 max-w-full overflow-hidden z-50">
            <div>
              <span className="font-bold mr-1">Source:</span>
              <span className="text-green-400">Blob Storage</span>
            </div>
            <div className="truncate" title={imageSrc}>
              <span className="font-bold mr-1">Path:</span>
              <span className="opacity-80">{imageSrc.substring(0, 25)}...</span>
            </div>
            <div className="truncate" title={imageInfo.original}>
              <span className="font-bold mr-1">Original:</span>
              <span className="opacity-80">{imageInfo.original}</span>
            </div>
          </div>
        )}
      </div>
    );
  }
  
  // For regular images, use the Next.js Image component
  return (
    <div className="relative">
      <Image 
        src={imageSrc} 
        {...props} 
        onError={(e) => {
          console.error(`[BlobImage] Error loading image: ${imageSrc}`);
          if (imageInfo.isBlob && !src.startsWith('blob:')) {
            // If blob URL fails, try falling back to the original
            console.log(`[BlobImage] Falling back to original: ${src}`);
            setImageSrc(src);
            setImageInfo({
              isBlob: false,
              original: src,
              error: 'Failed to load blob image, using original'
            });
          }
        }}
      />
      
      {/* Debug overlay - only shown in development mode by default */}
      {showDebug && (
        <div className="absolute top-0 left-0 bg-black/70 text-white text-xs p-1 max-w-full overflow-hidden z-50">
          <div>
            <span className="font-bold mr-1">Source:</span>
            <span className="text-yellow-400">Local File</span>
          </div>
          <div className="truncate" title={imageSrc}>
            <span className="font-bold mr-1">Path:</span>
            <span className="opacity-80">{imageSrc}</span>
          </div>
          {imageInfo.error && (
            <div className="truncate text-red-400" title={imageInfo.error}>
              <span className="font-bold mr-1">Error:</span>
              <span>{imageInfo.error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 