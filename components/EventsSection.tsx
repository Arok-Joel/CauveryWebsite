'use client';

import { useState, useEffect } from 'react';
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

interface EventsSectionProps {
  minimal?: boolean;
}

export function EventsSection({ minimal = false }: EventsSectionProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await fetch('/api/events');
        
        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }
        
        const data = await response.json();
        setEvents(data);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Could not load events. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchEvents();
  }, []);

  // If minimal is true, render a more compact version
  if (minimal) {
    if (loading) {
      return (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((index) => (
            <div key={index} className="h-8 bg-[#2a4130] rounded"></div>
          ))}
        </div>
      );
    }

    if (error) {
      return <div className="text-center text-red-200">{error}</div>;
    }

    if (events.length === 0) {
      return <p className="text-center text-green-100">No events available.</p>;
    }

    return (
      <div className="space-y-4 h-full max-h-[400px] overflow-y-auto pr-2 green-scrollbar">
        {events.map((event) => (
          <div key={event.id} className="last:border-0">
            <Link 
              href={`/events/${event.id}`}
              className="flex items-center justify-between bg-white/10 hover:bg-white/20 active:bg-white/30 transition-colors rounded-lg px-4 py-3 text-base text-white font-medium shadow-sm group focus:outline-none focus:ring-2 focus:ring-green-300"
            >
              <span className="truncate group-hover:underline">{event.title}</span>
              <span className="ml-2 text-green-200 group-hover:translate-x-1 transition-transform">
                <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><path d="M7 5l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </span>
            </Link>
          </div>
        ))}
      </div>
    );
  }

  // Original full-width version
  if (loading) {
    return (
      <section className="bg-[#3C5A3E] text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-10">News & Events</h2>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((index) => (
              <div key={index} className="h-12 bg-[#2a4130] rounded"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="bg-[#3C5A3E] text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-10">News & Events</h2>
          <div className="text-center text-red-200">{error}</div>
        </div>
      </section>
    );
  }

  if (events.length === 0) {
    return (
      <section className="bg-[#3C5A3E] text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-10">News & Events</h2>
          <p className="text-center text-green-100">No events available at the moment.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-[#3C5A3E] text-white py-12">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-10">News & Events</h2>
        <div className="space-y-6">
          {events.map((event) => (
            <div key={event.id} className="border-b border-[#5d7a5f] pb-6 last:border-0">
              <Link 
                href={`/events/${event.id}`} 
                className="block text-lg md:text-xl hover:text-green-200 transition-colors focus:outline-none focus:ring-2 focus:ring-green-300 rounded p-1"
              >
                {event.title}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 