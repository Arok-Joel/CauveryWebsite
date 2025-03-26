'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/admin/messages', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const response = await fetch(`/api/admin/messages/${messageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isRead: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to update message');
      }

      // Update local state
      setMessages(messages.map(msg => 
        msg.id === messageId ? { ...msg, isRead: true } : msg
      ));

      toast.success('Message marked as read');
    } catch (error) {
      toast.error('Failed to update message');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Contact Messages</h1>
      
      <div className="space-y-4">
        {messages.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              No messages received yet
            </CardContent>
          </Card>
        ) : (
          messages.map((message) => (
            <Card 
              key={message.id} 
              className={`transition-colors ${!message.isRead ? 'bg-gray-50' : ''}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{message.name}</CardTitle>
                  <Badge 
                    variant={message.isRead ? "secondary" : "default"}
                    className="cursor-pointer"
                    onClick={() => !message.isRead && markAsRead(message.id)}
                  >
                    {message.isRead ? 'Read' : 'Unread'}
                  </Badge>
                </div>
                <div className="text-sm text-gray-500">
                  {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">Email:</span> {message.email}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Phone:</span> {message.phone}
                  </div>
                  <div className="mt-4 text-gray-700">
                    {message.message}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
} 