'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { BlobImage } from '@/components/BlobImage';
import { format } from 'date-fns';
import { Calendar, MapPin, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string | null;
  location: string | null;
  images: string[];
  imageUrl?: string | null;
}

export default function EventPage() {
  const { id } = useParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEvent() {
      try {
        const response = await fetch(`/api/events/${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch event');
        }
        
        const data = await response.json();
        setEvent(data);
      } catch (err) {
        console.error('Error fetching event:', err);
        setError('Could not load event details. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchEvent();
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 text-red-500 p-4 rounded">
            <p>{error || 'Event not found'}</p>
            <Link href="/" className="mt-4 inline-flex items-center text-[#3C5A3E] hover:underline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Use imageUrl first, then first image from images array, or a placeholder
  const mainImage = event.imageUrl || (event.images?.length > 0 
    ? event.images[0] 
    : '/images/event-placeholder.jpg');

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <Link 
          href="/" 
          className="inline-flex items-center text-[#3C5A3E] hover:text-[#2a4130] mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to home
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold mb-4 text-[#3C5A3E]">{event.title}</h1>
        
        <div className="flex flex-wrap gap-4 mb-6">
          {event.date && (
            <div className="flex items-center text-gray-600">
              <Calendar className="h-5 w-5 mr-2 text-[#3C5A3E]" />
              <span>{format(new Date(event.date), 'MMMM dd, yyyy')}</span>
            </div>
          )}
          
          {event.location && (
            <div className="flex items-center text-gray-600">
              <MapPin className="h-5 w-5 mr-2 text-[#3C5A3E]" />
              <span>{event.location}</span>
            </div>
          )}
        </div>

        {mainImage && (
          <div className="mb-8 relative rounded-lg overflow-hidden h-[400px]">
            <BlobImage
              src={mainImage}
              alt={event.title}
              fill
              className="object-cover"
              useBlobStorage={true}
            />
          </div>
        )}

        <div className="prose max-w-none mb-10">
          <p className="whitespace-pre-line">{event.description}</p>
        </div>

        {event.images && event.images.length > 1 && (
          <div className="mt-10">
            <h2 className="text-2xl font-bold mb-4 text-[#3C5A3E]">Event Gallery</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {event.images.slice(event.imageUrl ? 0 : 1).map((img, index) => (
                // Skip the first image if it's already the main image and there's no imageUrl
                (event.imageUrl || index > 0 || event.images.length === 1) && (
                  <div key={index} className="relative h-48 rounded-lg overflow-hidden">
                    <BlobImage
                      src={img}
                      alt={`${event.title} image ${index + 1}`}
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-300"
                      useBlobStorage={true}
                    />
                  </div>
                )
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 