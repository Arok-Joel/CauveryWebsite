'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  CreditCard, 
  Building, 
  Users,
  Edit,
  Save,
  X,
  Download,
  Receipt,
  Upload
} from 'lucide-react';
import { toast } from 'sonner';
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { generatePDF } from '@/lib/pdf-generator';

interface UserProfile {
  user: {
    name: string;
    email: string;
    phone: string;
    address: string;
    pincode: string;
    profileImage?: string;
  };
  bookedPlots: {
    id: string;
    plotNumber: string;
    size: string;
    price: string;
    bookingDate: string;
    status: string;
  }[];
}

export default function UserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showAllPlots, setShowAllPlots] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/user/profile', {
          credentials: 'include'
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Profile fetch error:', errorData);
          throw new Error(errorData.error || 'Failed to fetch profile');
        }
        
        const data = await response.json();
        console.log('Profile data:', data);
        setProfile(data);
        setEditedProfile(data);
      } catch (error) {
        console.error('Error loading profile:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleEdit = () => {
    setEditing(true);
  };

  const handleSave = async () => {
    if (!editedProfile) return;

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedProfile.user),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      setProfile(editedProfile);
      setEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setEditing(false);
  };

  const handleDownloadReceipt = async (plot: UserProfile['bookedPlots'][0]) => {
    try {
      const details = {
        plotNumber: plot.plotNumber,
        customerName: profile?.user.name || '',
        price: plot.price,
        size: plot.size,
        date: new Date(plot.bookingDate).toLocaleDateString(),
        phoneNumber: profile?.user.phone || '',
        email: profile?.user.email || '',
        employeeId: '', // These will be fetched from the booking details
        employeeName: '',
        employeeRole: '',
      };

      // Fetch employee details for this booking
      const bookingResponse = await fetch(`/api/bookings/${plot.id}`);
      if (bookingResponse.ok) {
        const bookingData = await bookingResponse.json();
        details.employeeId = bookingData.employeeId;
        details.employeeName = bookingData.employeeName;
        details.employeeRole = bookingData.employeeRole;
      }

      await generatePDF(details);
    } catch (error) {
      toast.error('Failed to generate receipt');
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size should be less than 2MB');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('profileImage', file);

      const response = await fetch('/api/user/profile/image', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload profile image');
      }

      setProfile(prev => prev ? {
        ...prev,
        user: {
          ...prev.user,
          profileImage: data.imageUrl
        }
      } : null);
      
      // Dispatch a custom event to notify the navbar
      const event = new CustomEvent('profileUpdated');
      window.dispatchEvent(event);
      
      toast.success('Profile image updated successfully');
    } catch (error) {
      console.error('Error uploading profile image:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload profile image');
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Get the plots to display based on showAllPlots state
  const displayedPlots = showAllPlots ? profile?.bookedPlots : profile?.bookedPlots.slice(0, 3);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-32" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-500">Profile not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-semibold mb-6">Profile</h1>
      <div className="space-y-6">
        {/* Profile Header Card */}
        <div className="bg-[#3C5A3E] text-white rounded-lg p-8">
          <div className="flex items-start gap-6">
            <div className="relative">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                className="hidden"
                accept="image/*"
              />
              {isUploading ? (
                <div className="h-24 w-24 rounded-full bg-white/20 flex items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
                </div>
              ) : (
                <div className="relative group">
                  <Avatar className="h-24 w-24 border-4 border-white/20">
                    {profile.user.profileImage ? (
                      <img 
                        src={profile.user.profileImage} 
                        alt={profile.user.name} 
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <AvatarFallback className="bg-white/20 text-white text-2xl">
                        {profile.user.name[0].toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <button 
                    onClick={triggerFileInput}
                    className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Upload className="h-4 w-4 text-[#3C5A3E]" />
                  </button>
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-semibold">{profile.user.name}</h2>
                <p className="text-[#e5e7eb] text-sm mt-1">USER</p>
              </div>
              <div className="flex items-center gap-8 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>{profile.user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>{profile.user.phone}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Personal Information */}
          <Card className="border border-gray-200 h-fit">
            <CardHeader className="border-b bg-gray-50/50 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-[#3C5A3E]" />
                  <CardTitle className="text-lg font-medium">Personal Information</CardTitle>
                </div>
                {!editing ? (
                  <Button variant="ghost" size="sm" onClick={handleEdit} className="text-[#3C5A3E] hover:text-[#3C5A3E] hover:bg-[#3C5A3E]/10">
                    <Edit className="h-4 w-4" />
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={handleCancel} className="text-red-500 hover:text-red-500 hover:bg-red-50">
                      <X className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleSave} className="text-[#3C5A3E] hover:text-[#3C5A3E] hover:bg-[#3C5A3E]/10">
                      <Save className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {editing ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">Full Name</label>
                      <Input
                        value={editedProfile?.user.name || ''}
                        onChange={(e) =>
                          setEditedProfile((prev) =>
                            prev ? { ...prev, user: { ...prev.user, name: e.target.value } } : null
                          )
                        }
                        className="border-gray-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <Input
                        value={editedProfile?.user.email || ''}
                        onChange={(e) =>
                          setEditedProfile((prev) =>
                            prev ? { ...prev, user: { ...prev.user, email: e.target.value } } : null
                          )
                        }
                        className="border-gray-200"
                        disabled
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">Phone Number</label>
                      <Input
                        value={editedProfile?.user.phone || ''}
                        onChange={(e) =>
                          setEditedProfile((prev) =>
                            prev ? { ...prev, user: { ...prev.user, phone: e.target.value } } : null
                          )
                        }
                        className="border-gray-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">Address</label>
                      <Input
                        value={editedProfile?.user.address || ''}
                        onChange={(e) =>
                          setEditedProfile((prev) =>
                            prev ? { ...prev, user: { ...prev.user, address: e.target.value } } : null
                          )
                        }
                        className="border-gray-200"
                      />
                    </div>
                  </>
                ) : (
                  <div className="divide-y">
                    <div className="flex justify-between items-center py-3">
                      <span className="text-sm text-gray-500">Full Name</span>
                      <span className="font-medium">{profile.user.name}</span>
                    </div>
                    <div className="flex justify-between items-center py-3">
                      <span className="text-sm text-gray-500">Email</span>
                      <span className="font-medium">{profile.user.email}</span>
                    </div>
                    <div className="flex justify-between items-center py-3">
                      <span className="text-sm text-gray-500">Phone Number</span>
                      <span className="font-medium">{profile.user.phone}</span>
                    </div>
                    <div className="flex justify-between items-center py-3">
                      <span className="text-sm text-gray-500">Address</span>
                      <span className="font-medium">{profile.user.address || 'Not provided'}</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Booked Plots */}
          <Card className="border border-gray-200">
            <CardHeader className="border-b bg-gray-50/50 py-3">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-[#3C5A3E]" />
                <CardTitle className="text-lg font-medium">Booked Plots</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-4">
                {displayedPlots?.map((plot) => (
                  <Card key={plot.id}>
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="space-y-2">
                          <p className="text-lg font-medium">Plot Number: {plot.plotNumber}</p>
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              Size: {plot.size}
                            </span>
                            <span className="flex items-center gap-1">
                              <CreditCard className="h-4 w-4" />
                              Price: ₹{plot.price}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              Booked on: {new Date(plot.bookingDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          className="flex items-center gap-2"
                          onClick={() => handleDownloadReceipt(plot)}
                        >
                          <Receipt className="h-4 w-4" />
                          Download Receipt
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {profile?.bookedPlots.length > 3 && (
                <div className="mt-4 flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => setShowAllPlots(!showAllPlots)}
                    className="flex items-center gap-2"
                  >
                    {showAllPlots ? 'Show Less' : 'View All Plots'}
                  </Button>
                </div>
              )}
              
              {profile?.bookedPlots.length === 0 && (
                <Card>
                  <CardContent className="p-6 text-center text-gray-500">
                    No plots booked yet
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Account Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">Delete Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete your account? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-300">Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700">
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 