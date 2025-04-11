'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { MapPin, Phone, Mail, Clock, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const contactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

interface PhoneNumber {
  id: string;
  number: string;
  isDefault: boolean;
}

interface AdminContactInfo {
  id: string;
  address: string;
  email: string;
  phoneNumbers: PhoneNumber[];
  topEmployeePhone: string;
  topEmployeeName: string;
  topEmployeeRole: string;
}

export default function ContactPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [adminContactInfo, setAdminContactInfo] = useState<AdminContactInfo | null>(null);
  const [isLoadingContactInfo, setIsLoadingContactInfo] = useState(true);

  // Fetch admin contact information
  useEffect(() => {
    const fetchAdminContactInfo = async () => {
      try {
        setIsLoadingContactInfo(true);
        const response = await fetch('/api/contact/info');
        
        if (response.ok) {
          const data = await response.json();
          setAdminContactInfo(data);
        }
      } catch (error) {
        console.error('Error fetching contact information:', error);
      } finally {
        setIsLoadingContactInfo(false);
      }
    };
    
    fetchAdminContactInfo();
  }, []);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      message: '',
    },
  });

  async function onSubmit(data: ContactFormValues) {
    try {
      setIsLoading(true);
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      toast.success('Message sent successfully!');
      form.reset();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  // Format address for display
  const getAddressLines = () => {
    if (!adminContactInfo?.address) {
      return [];
    }
    
    return adminContactInfo.address.split('\n');
  };

  // Get phone numbers, with default first
  const getPhoneNumbers = () => {
    // Only return the top employee phone number if it exists
    if (adminContactInfo?.topEmployeePhone) {
      return [`${adminContactInfo.topEmployeeName} (${adminContactInfo.topEmployeeRole}) - ${adminContactInfo.topEmployeePhone}`];
    }
    
    return [];
  };

  // Get email addresses
  const getEmailAddresses = () => {
    if (!adminContactInfo?.email) {
      return [];
    }
    
    return [adminContactInfo.email];
  };

  // Prepare contact info sections
  const contactInfoSections = [
    {
      icon: MapPin,
      title: "Visit Us",
      details: getAddressLines(),
    },
    {
      icon: Phone,
      title: 'Call Us',
      details: getPhoneNumbers(),
    },
    {
      icon: Mail,
      title: 'Email Us',
      details: getEmailAddresses(),
    },
    {
      icon: Clock,
      title: 'Business Hours',
      details: ['Monday - Saturday', '9:00 AM - 6:00 PM'],
    },
  ];

  return (
    <main className="min-h-screen bg-[#FAF9F6] py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Have questions about our plots or want to schedule a visit? We're here to help. Reach
            out to us through any of the following channels or fill out the contact form below.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          {/* Contact Information */}
          <div className="grid sm:grid-cols-2 gap-6">
            {isLoadingContactInfo ? (
              // Show skeletons while loading
              Array(4).fill(0).map((_, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="flex items-center mb-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                    </div>
                    <Skeleton className="h-6 w-32 mb-4" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              // Only show contact info when data is loaded
              contactInfoSections.map((info, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 bg-[#3C5A3E]/10 rounded-full flex items-center justify-center mb-4">
                      <info.icon className="w-6 h-6 text-[#3C5A3E]" />
                    </div>
                    <CardTitle className="text-lg mb-2">{info.title}</CardTitle>
                    {info.details.length > 0 ? (
                      info.details.map((detail, idx) => (
                        <p key={idx} className="text-gray-600">{detail}</p>
                      ))
                    ) : (
                      <p className="text-gray-500 italic">Information not available</p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle>Send us a Message</CardTitle>
              <CardDescription>
                Fill out the form below and we'll get back to you as soon as possible.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="john@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="1234567890" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell us how we can help..."
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full bg-[#3C5A3E] hover:bg-[#2A3F2B] text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send Message'
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Map */}
        <Card>
          <CardContent className="p-0">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d3919.289703686081!2d78.6843101!3d10.807659099999999!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3baaf5f9d64c8a45%3A0xb616962dc6124094!2s117%2C%205th%20Cross%20St%2C%20Indian%20Bank%20Colony%2C%20K.K.Nagar%2C%20Tiruchirappalli%2C%20Tamil%20Nadu%20620021!5e0!3m2!1sen!2sin!4v1709699574961!5m2!1sen!2sin"
              width="100%"
              height="400"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
