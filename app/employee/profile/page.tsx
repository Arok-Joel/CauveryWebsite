'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { Skeleton } from '@/components/ui/skeleton';

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
  };
}

export default function EmployeeProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (!profile) {
    return <div>Failed to load profile</div>;
  }

  const sections = [
    {
      title: 'Personal Information',
      fields: [
        { label: 'Full Name', value: profile.user.name },
        { label: 'Email', value: profile.user.email },
        { label: 'Phone Number', value: profile.user.phone },
        { label: 'Address', value: profile.user.address },
        { label: 'Pincode', value: profile.user.pincode },
      ],
    },
    {
      title: 'Guardian Information',
      fields: [{ label: 'Guardian Name', value: profile.employee.guardianName }],
    },
    {
      title: 'Employee Details',
      fields: [
        {
          label: 'Date of Birth',
          value: new Date(profile.employee.dateOfBirth).toLocaleDateString(),
        },
        { label: 'Age', value: profile.employee.age },
        { label: 'Gender', value: profile.employee.gender },
        { label: 'PAN Card Number', value: profile.employee.pancardNumber },
        { label: 'Aadhar Card Number', value: profile.employee.aadharCardNumber },
        {
          label: 'Date of Joining',
          value: new Date(profile.employee.dateOfJoining).toLocaleDateString(),
        },
        { label: 'Role', value: profile.employee.employeeRole.replace(/_/g, ' ') },
      ],
    },
    {
      title: 'Bank Details',
      fields: [
        { label: 'Bank Name', value: profile.employee.bankName },
        { label: 'Branch', value: profile.employee.bankBranch },
        { label: 'Account Number', value: profile.employee.accountNumber },
        { label: 'IFSC Code', value: profile.employee.ifscCode },
      ],
    },
  ];

  return (
    <div className="grid gap-6">
      {sections.map(section => (
        <Card key={section.title}>
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-[#3C5A3E]">{section.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2">
              {section.fields.map(field => (
                <div key={field.label} className="space-y-1">
                  <dt className="text-sm font-medium text-gray-500">{field.label}</dt>
                  <dd className="text-base">{field.value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="grid gap-6">
      {[1, 2, 3, 4].map(i => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-[200px]" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {[1, 2, 3, 4].map(j => (
                <div key={j} className="space-y-2">
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-5 w-[200px]" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
