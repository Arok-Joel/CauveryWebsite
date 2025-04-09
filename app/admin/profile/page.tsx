'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { MapPin, Phone, Mail, Plus, Check, Trash, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';

// Define the form validation schema
const profileFormSchema = z.object({
  address: z.string().min(1, "Address is required"),
  email: z.string().email("Invalid email address"),
  phoneNumbers: z.array(
    z.object({
      id: z.string().optional(),
      number: z.string().min(10, "Phone number must be at least 10 digits"),
      isDefault: z.boolean().default(false),
    })
  ).min(1, "At least one phone number is required")
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

// Define the interface for API response
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
}

export default function AdminProfilePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [contactInfo, setContactInfo] = useState<AdminContactInfo | null>(null);
  const router = useRouter();

  // Setup form with react-hook-form
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      address: "",
      email: "",
      phoneNumbers: [{ number: "", isDefault: true }],
    },
  });

  // Fetch existing contact info on component mount
  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/admin/profile');
        
        if (response.ok) {
          const data = await response.json();
          setContactInfo(data);
          
          // Set form values with fetched data
          form.reset({
            address: data.address,
            email: data.email,
            phoneNumbers: data.phoneNumbers,
          });
        }
      } catch (error) {
        console.error('Error fetching admin profile:', error);
        toast.error('Failed to load profile information');
      } finally {
        setIsLoading(false);
      }
    };

    fetchContactInfo();
  }, [form]);

  // Handle form submission
  async function onSubmit(data: ProfileFormValues) {
    try {
      setIsLoading(true);
      
      // Ensure at least one phone number is set as default
      const hasDefault = data.phoneNumbers.some(phone => phone.isDefault);
      if (!hasDefault && data.phoneNumbers.length > 0) {
        data.phoneNumbers[0].isDefault = true;
      }
      
      // First, check debug endpoint to verify auth state and database access
      const debugResponse = await fetch('/api/admin/profile/debug');
      if (!debugResponse.ok) {
        const debugData = await debugResponse.json();
        console.error('Debug endpoint failed:', debugData);
        toast.error(`Auth issue: ${debugData.error || 'Unknown error'}`);
        return;
      }
      
      const debugInfo = await debugResponse.json();
      console.log('Debug info:', debugInfo);
      
      // If debug shows missing models, show appropriate error
      if (!debugInfo.prisma.hasAdminContactInfo || !debugInfo.prisma.hasPhoneNumber) {
        toast.error('Database schema is missing required models. Please run prisma generate and restart the server.');
        return;
      }
      
      // Now proceed with the actual request
      const response = await fetch('/api/admin/profile', {
        method: contactInfo ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error response:', errorData);
        throw new Error(errorData.error || 'Failed to save profile information');
      }

      const updatedData = await response.json();
      setContactInfo(updatedData);
      
      toast.success('Profile information saved successfully');
      router.refresh();
    } catch (error) {
      console.error('Error saving profile information:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save profile information');
    } finally {
      setIsLoading(false);
    }
  }

  // Add a new phone number field
  const addPhoneNumber = () => {
    const currentPhoneNumbers = form.getValues().phoneNumbers;
    form.setValue('phoneNumbers', [
      ...currentPhoneNumbers,
      { number: '', isDefault: currentPhoneNumbers.length === 0 }
    ]);
  };

  // Remove a phone number field
  const removePhoneNumber = (index: number) => {
    const currentPhoneNumbers = form.getValues().phoneNumbers;
    
    // Don't allow removing the last phone number
    if (currentPhoneNumbers.length <= 1) {
      toast.error("At least one phone number is required");
      return;
    }
    
    // If removing the default number, set another one as default
    if (currentPhoneNumbers[index].isDefault && currentPhoneNumbers.length > 1) {
      const newDefaultIndex = index === 0 ? 1 : 0;
      currentPhoneNumbers[newDefaultIndex].isDefault = true;
    }
    
    const newPhoneNumbers = currentPhoneNumbers.filter((_, i) => i !== index);
    form.setValue('phoneNumbers', newPhoneNumbers);
  };

  // Set a phone number as default
  const setDefaultPhoneNumber = (index: number) => {
    const phoneNumbers = form.getValues().phoneNumbers.map((phone, i) => ({
      ...phone,
      isDefault: i === index
    }));
    form.setValue('phoneNumbers', phoneNumbers);
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Admin Profile</h1>
        </div>
        
        <Separator />
        
        {isLoading && !contactInfo ? (
          // Loading state when initially fetching contact info
          <Card>
            <CardHeader>
              <CardTitle>Loading Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center p-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <p className="text-sm text-muted-foreground">Loading your contact information...</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                  {!contactInfo?.id && (
                    <p className="text-sm text-muted-foreground mt-1">
                      No contact information has been set up yet. Fill out the form below to set up your contact information.
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Address Field */}
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter your full address" 
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Email Field */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="admin@example.com" 
                            type="email"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Phone Numbers Section */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <FormLabel>Phone Numbers</FormLabel>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={addPhoneNumber}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Phone Number
                      </Button>
                    </div>
                    
                    {form.watch('phoneNumbers').map((_, index) => (
                      <div key={index} className="flex items-end gap-4">
                        <FormField
                          control={form.control}
                          name={`phoneNumbers.${index}.number`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input
                                  placeholder="Enter phone number"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name={`phoneNumbers.${index}.isDefault`}
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={() => setDefaultPhoneNumber(index)}
                                    disabled={field.value}
                                  />
                                  {field.value && (
                                    <Badge variant="outline" className="font-normal">
                                      Default
                                    </Badge>
                                  )}
                                </div>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removePhoneNumber(index)}
                        >
                          <Trash className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <div className="flex justify-end">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <p className="text-sm text-muted-foreground">
              This is how your contact information will appear on the Contact page
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  {form.watch('address') ? (
                    form.watch('address').split('\n').map((line, i) => (
                      <p key={i} className="text-sm">{line}</p>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No address provided</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                {form.watch('email') ? (
                  <span className="text-sm">{form.watch('email')}</span>
                ) : (
                  <span className="text-sm text-muted-foreground italic">No email provided</span>
                )}
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Phone Numbers:</span>
                </div>
                
                <div className="ml-6 space-y-1">
                  {form.watch('phoneNumbers').length > 0 && form.watch('phoneNumbers').some(p => p.number) ? (
                    form.watch('phoneNumbers').map((phone, index) => (
                      phone.number ? (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <span>{phone.number}</span>
                          {phone.isDefault && (
                            <Badge variant="outline" className="text-xs">Default</Badge>
                          )}
                        </div>
                      ) : null
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No phone numbers provided</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 