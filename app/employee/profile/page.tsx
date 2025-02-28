'use client';

import { useEffect, useState } from 'react';
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
  Briefcase,
  Edit,
  Save,
  X
} from 'lucide-react';
import { toast } from 'sonner';

interface EmployeeProfile {
  user: {
    name: string;
    email: string;
    phone: string;
    address: string;
    pincode: string;
  };
  employee: {
    guardianName: string;
    dateOfBirth: string;
    age: number;
    gender: string;
    pancardNumber: string;
    aadharCardNumber: string;
    bankName: string;
    bankBranch: string;
    accountNumber: string;
    ifscCode: string;
    dateOfJoining: string;
    employeeRole: string;
    id: string;
  };
}

export default function EmployeeProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editMode, setEditMode] = useState<Record<string, boolean>>({});
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch('/api/employee/profile', {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }

        const data = await response.json();
        setProfile(data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfile();
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const formatRole = (role: string) => {
    return role.replace(/_/g, ' ');
  };

  const toggleEditMode = (field: string, initialValue: string) => {
    setEditMode(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
    
    if (!editMode[field]) {
      setEditedValues(prev => ({
        ...prev,
        [field]: initialValue
      }));
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setEditedValues(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveField = async (field: string, section: 'user' | 'employee') => {
    if (!profile) return;
    
    setIsSaving(true);
    try {
      // In a real implementation, you would send this to your API
      const response = await fetch('/api/employee/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          section,
          field,
          value: editedValues[field]
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      // Update the local state with the new value
      if (section === 'user') {
        setProfile(prev => prev ? {
          ...prev,
          user: {
            ...prev.user,
            [field]: editedValues[field]
          }
        } : null);
      } else {
        setProfile(prev => prev ? {
          ...prev,
          employee: {
            ...prev.employee,
            [field]: editedValues[field]
          }
        } : null);
      }

      // Exit edit mode
      setEditMode(prev => ({
        ...prev,
        [field]: false
      }));

      toast.success(`${field} updated successfully`);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const renderEditableField = (
    label: string, 
    value: string, 
    field: string, 
    section: 'user' | 'employee',
    icon: React.ReactNode,
    readOnly: boolean = false
  ) => {
    return (
      <div className="flex justify-between items-start border-b pb-3">
        <dt className="text-sm font-medium text-gray-500 flex items-center">
          {icon}
          {label}
        </dt>
        <div className="flex items-center gap-2">
          {editMode[field] && !readOnly ? (
            <>
              <Input
                value={editedValues[field]}
                onChange={(e) => handleInputChange(field, e.target.value)}
                className="h-8 w-[180px] text-sm"
              />
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-8 w-8" 
                onClick={() => saveField(field, section)}
                disabled={isSaving}
              >
                <Save className="h-4 w-4 text-green-600" />
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-8 w-8" 
                onClick={() => toggleEditMode(field, value)}
              >
                <X className="h-4 w-4 text-red-600" />
              </Button>
            </>
          ) : (
            <>
              <dd className="text-sm font-medium text-right">{value}</dd>
              {!readOnly && (
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8 ml-2" 
                  onClick={() => toggleEditMode(field, value)}
                >
                  <Edit className="h-4 w-4 text-gray-500" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="bg-red-100 text-red-800 p-4 rounded-lg">
            <p className="font-medium">Failed to load profile</p>
            <p className="text-sm mt-1">Please try again later</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-[#3C5A3E] to-[#5A8C5E] p-6 text-white">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <Avatar className="h-24 w-24 border-4 border-white/30">
              <AvatarFallback className="bg-[#3C5A3E] text-white text-2xl">
                {getInitials(profile.user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="text-center md:text-left">
              <h1 className="text-2xl font-bold">{profile.user.name}</h1>
              <Badge className="mt-2 bg-white/20 hover:bg-white/30 text-white">
                {formatRole(profile.employee.employeeRole)}
              </Badge>
              <div className="mt-3 flex flex-col md:flex-row gap-3 md:gap-6 text-sm text-white/80">
                <div className="flex items-center justify-center md:justify-start">
                  <Mail className="h-4 w-4 mr-2" />
                  <span>{profile.user.email}</span>
                </div>
                <div className="flex items-center justify-center md:justify-start">
                  <Phone className="h-4 w-4 mr-2" />
                  <span>{profile.user.phone}</span>
                </div>
                <div className="flex items-center justify-center md:justify-start">
                  <Briefcase className="h-4 w-4 mr-2" />
                  <span>ID: {profile.employee.id}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <User className="mr-2 h-5 w-5 text-[#3C5A3E]" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              {renderEditableField(
                "Full Name", 
                profile.user.name, 
                "name", 
                "user", 
                <User className="mr-2 h-4 w-4 text-gray-400" />
              )}
              {renderEditableField(
                "Email", 
                profile.user.email, 
                "email", 
                "user", 
                <Mail className="mr-2 h-4 w-4 text-gray-400" />
              )}
              {renderEditableField(
                "Phone Number", 
                profile.user.phone, 
                "phone", 
                "user", 
                <Phone className="mr-2 h-4 w-4 text-gray-400" />
              )}
              {renderEditableField(
                "Address", 
                profile.user.address, 
                "address", 
                "user", 
                <MapPin className="mr-2 h-4 w-4 text-gray-400" />
              )}
              {renderEditableField(
                "Pincode", 
                profile.user.pincode, 
                "pincode", 
                "user", 
                <MapPin className="mr-2 h-4 w-4 text-gray-400" />
              )}
            </dl>
          </CardContent>
        </Card>

        {/* Employee Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Briefcase className="mr-2 h-5 w-5 text-[#3C5A3E]" />
              Employee Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              {renderEditableField(
                "Date of Birth", 
                new Date(profile.employee.dateOfBirth).toLocaleDateString(), 
                "dateOfBirth", 
                "employee", 
                <Calendar className="mr-2 h-4 w-4 text-gray-400" />,
                true
              )}
              {renderEditableField(
                "Age", 
                profile.employee.age.toString(), 
                "age", 
                "employee", 
                <Users className="mr-2 h-4 w-4 text-gray-400" />,
                true
              )}
              {renderEditableField(
                "Gender", 
                profile.employee.gender, 
                "gender", 
                "employee", 
                <Users className="mr-2 h-4 w-4 text-gray-400" />,
                true
              )}
              {renderEditableField(
                "Date of Joining", 
                new Date(profile.employee.dateOfJoining).toLocaleDateString(), 
                "dateOfJoining", 
                "employee", 
                <Calendar className="mr-2 h-4 w-4 text-gray-400" />,
                true
              )}
              {renderEditableField(
                "Role", 
                formatRole(profile.employee.employeeRole), 
                "employeeRole", 
                "employee", 
                <Briefcase className="mr-2 h-4 w-4 text-gray-400" />,
                true
              )}
            </dl>
          </CardContent>
        </Card>

        {/* Guardian Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Users className="mr-2 h-5 w-5 text-[#3C5A3E]" />
              Guardian Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              {renderEditableField(
                "Guardian Name", 
                profile.employee.guardianName, 
                "guardianName", 
                "employee", 
                <User className="mr-2 h-4 w-4 text-gray-400" />
              )}
            </dl>
          </CardContent>
        </Card>

        {/* ID Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <CreditCard className="mr-2 h-5 w-5 text-[#3C5A3E]" />
              ID Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              {renderEditableField(
                "PAN Card Number", 
                profile.employee.pancardNumber, 
                "pancardNumber", 
                "employee", 
                <CreditCard className="mr-2 h-4 w-4 text-gray-400" />
              )}
              {renderEditableField(
                "Aadhar Card Number", 
                profile.employee.aadharCardNumber, 
                "aadharCardNumber", 
                "employee", 
                <CreditCard className="mr-2 h-4 w-4 text-gray-400" />
              )}
            </dl>
          </CardContent>
        </Card>

        {/* Bank Details */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Building className="mr-2 h-5 w-5 text-[#3C5A3E]" />
              Bank Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              {renderEditableField(
                "Bank Name", 
                profile.employee.bankName, 
                "bankName", 
                "employee", 
                <Building className="mr-2 h-4 w-4 text-gray-400" />
              )}
              {renderEditableField(
                "Branch", 
                profile.employee.bankBranch, 
                "bankBranch", 
                "employee", 
                <Building className="mr-2 h-4 w-4 text-gray-400" />
              )}
              {renderEditableField(
                "Account Number", 
                profile.employee.accountNumber, 
                "accountNumber", 
                "employee", 
                <CreditCard className="mr-2 h-4 w-4 text-gray-400" />
              )}
              {renderEditableField(
                "IFSC Code", 
                profile.employee.ifscCode, 
                "ifscCode", 
                "employee", 
                <CreditCard className="mr-2 h-4 w-4 text-gray-400" />
              )}
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      {/* Profile Header Skeleton */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-[#3C5A3E] to-[#5A8C5E] p-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="w-full max-w-md">
              <Skeleton className="h-8 w-48 mx-auto md:mx-0 mb-3" />
              <Skeleton className="h-6 w-24 mx-auto md:mx-0 mb-3" />
              <div className="flex flex-col md:flex-row gap-3 md:gap-6">
                <Skeleton className="h-5 w-32 mx-auto md:mx-0" />
                <Skeleton className="h-5 w-32 mx-auto md:mx-0" />
                <Skeleton className="h-5 w-32 mx-auto md:mx-0" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cards Skeleton */}
      <div className="grid gap-6 md:grid-cols-2">
        {[1, 2, 3, 4, 5].map(i => (
          <Card key={i} className={i === 5 ? "md:col-span-2" : ""}>
            <CardHeader>
              <Skeleton className="h-6 w-[200px]" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: i === 3 ? 1 : 4 }).map((_, j) => (
                  <div key={j} className="flex justify-between items-start border-b pb-3">
                    <Skeleton className="h-5 w-[120px]" />
                    <Skeleton className="h-5 w-[150px]" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
