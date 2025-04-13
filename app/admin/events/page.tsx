'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Calendar, MapPin, Image, Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string | null;
  location: string | null;
  images: string[];
  imageUrl?: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await fetch('/api/admin/events');
        
        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }
        
        const data = await response.json();
        setEvents(data);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchEvents();
  }, []);

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Events</h1>
          <p className="text-muted-foreground">Manage website events</p>
        </div>
        <Button asChild>
          <Link href="/admin/events/new">
            <Plus className="mr-2 h-4 w-4" /> Create Event
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-md"></div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-10">
          <h3 className="text-lg font-medium">No events found</h3>
          <p className="text-muted-foreground mt-1">Create your first event to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {events.map((event) => (
            <div
              key={event.id}
              className="border rounded-md p-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-center"
            >
              <div className="md:col-span-3">
                <h3 className="font-medium text-lg">{event.title}</h3>
                <p className="text-muted-foreground line-clamp-1 mt-1">
                  {event.description}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                  {event.date && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="mr-1 h-3 w-3" />
                      {format(new Date(event.date), 'MMM dd, yyyy')}
                    </div>
                  )}
                  {event.location && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="mr-1 h-3 w-3" />
                      {event.location}
                    </div>
                  )}
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Image className="mr-1 h-3 w-3" />
                    {event.images.length} image(s)
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/admin/events/${event.id}`)}
                >
                  Edit
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 