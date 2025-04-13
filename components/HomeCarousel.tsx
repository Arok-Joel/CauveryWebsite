'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { BlobImage } from '@/components/BlobImage';

interface CarouselImage {
  url: string;
  alt: string;
}

interface HomeCarouselProps {
  images: CarouselImage[];
  autoplaySpeed?: number;
}

export default function HomeCarousel({ 
  images, 
  autoplaySpeed = 5000
}: HomeCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  
  // Handle prev/next navigation
  const goToPrevious = useCallback(() => {
    const newIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  }, [currentIndex, images.length]);
  
  const goToNext = useCallback(() => {
    const newIndex = currentIndex === images.length - 1 ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  }, [currentIndex, images.length]);
  
  // Handle autoplay
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (isAutoPlaying && images.length > 1) {
      intervalId = setInterval(goToNext, autoplaySpeed);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isAutoPlaying, goToNext, autoplaySpeed, images.length]);
  
  // Pause autoplay when hovering
  const handleMouseEnter = () => setIsAutoPlaying(false);
  const handleMouseLeave = () => setIsAutoPlaying(true);
  
  // If no images, show nothing
  if (!images.length) return null;
  
  // If only one image, show it without controls
  if (images.length === 1) {
    return (
      <div className="relative rounded-lg overflow-hidden">
        <BlobImage
          src={images[0].url}
          alt={images[0].alt}
          height={500}
          width={1000}
          className="w-full h-[500px] object-cover"
          useBlobStorage={true}
        />
      </div>
    );
  }
  
  return (
    <div 
      className="relative rounded-lg overflow-hidden mx-auto w-full"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Main carousel */}
      <div className="relative aspect-[2/1] max-h-[500px] w-full">
        {images.map((image, index) => (
          <div 
            key={index}
            className={`absolute inset-0 transition-opacity duration-500 ${
              index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            <BlobImage
              src={image.url}
              alt={image.alt}
              fill
              className="object-cover"
              useBlobStorage={true}
            />
          </div>
        ))}
      </div>
      
      {/* Navigation buttons - positioned within the carousel */}
      <button 
        onClick={goToPrevious}
        className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 text-white rounded-full p-2 transition-colors"
        aria-label="Previous image"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      
      <button 
        onClick={goToNext}
        className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 text-white rounded-full p-2 transition-colors"
        aria-label="Next image"
      >
        <ChevronRight className="h-6 w-6" />
      </button>
      
      {/* Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex space-x-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentIndex 
                ? 'bg-white scale-110' 
                : 'bg-white/50 hover:bg-white/80'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
} 