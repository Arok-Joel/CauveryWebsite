'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BlobImage } from '@/components/BlobImage';
import { format } from 'date-fns';
import { Calendar, MapPin } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string | null;
  location: string | null;
  images: string[];
  imageUrl?: string | null;
}

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  
  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };
  
  // Use imageUrl first, then first image from images array, or a placeholder
  const thumbnail = event.imageUrl || (event.images?.length > 0 
    ? event.images[0] 
    : '/images/event-placeholder.jpg');
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg">
      <div className="relative h-48">
        <BlobImage
          src={thumbnail}
          alt={event.title}
          fill
          className="object-cover"
          useBlobStorage={true}
        />
      </div>
      
      <div className="p-4">
        <h3 className="text-xl font-semibold mb-2 text-gray-800">{event.title}</h3>
        
        <div className="flex flex-col space-y-2 mb-3">
          {event.date && (
            <div className="flex items-center text-gray-600">
              <Calendar className="h-4 w-4 mr-2" />
              <span className="text-sm">{format(new Date(event.date), 'MMMM dd, yyyy')}</span>
            </div>
          )}
          
          {event.location && (
            <div className="flex items-center text-gray-600">
              <MapPin className="h-4 w-4 mr-2" />
              <span className="text-sm">{event.location}</span>
            </div>
          )}
        </div>
        
        <button 
          onClick={toggleDetails} 
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
        
        {showDetails && (
          <div className="mt-3">
            <p className="text-gray-700 text-sm">{event.description}</p>
            
            {event.images && event.images.length > 1 && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold mb-2">Event Gallery</h4>
                <div className="grid grid-cols-3 gap-2">
                  {event.images.slice(1).map((img, index) => (
                    <div key={index} className="relative h-20">
                      <BlobImage
                        src={img}
                        alt={`${event.title} image ${index + 2}`}
                        fill
                        className="object-cover rounded-sm"
                        useBlobStorage={true}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 