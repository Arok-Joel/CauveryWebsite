'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Network, 
  Bell, 
  User, 
  Briefcase
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

interface ReportingStructure {
  self: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  manager: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  managerOfManager: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  directReports: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>;
}

interface EmployeeProfile {
  user: {
    name: string;
    email: string;
    phone: string;
    address: string;
    pincode: string;
    profileImage?: string;
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

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [reportingStructure, setReportingStructure] = useState<ReportingStructure | null>(null);
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(true);
  const [isLoadingReporting, setIsLoadingReporting] = useState(true);
  const [currentDate] = useState(new Date());
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  useEffect(() => {
    async function fetchAnnouncements() {
      try {
        const response = await fetch('/api/employee/announcements', {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch announcements');
        }

        const data = await response.json();
        setAnnouncements(data.announcements.slice(0, 3)); // Get only the 3 most recent
      } catch (error) {
        console.error('Error fetching announcements:', error);
      } finally {
        setIsLoadingAnnouncements(false);
      }
    }

    async function fetchReportingStructure() {
      try {
        const response = await fetch('/api/employee/reporting-structure', {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch reporting structure');
        }

        const data = await response.json();
        
        // Make sure we're getting the correct data structure
        if (data.reportingStructure) {
          setReportingStructure(data.reportingStructure);
        } else {
          console.error('Unexpected reporting structure format:', data);
        }
      } catch (error) {
        console.error('Error fetching reporting structure:', error);
      } finally {
        setIsLoadingReporting(false);
      }
    }

    async function fetchProfile() {
      try {
        setIsLoadingProfile(true);
        const response = await fetch('/api/employee/profile', {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }

        const data = await response.json();
        console.log('Dashboard profile data:', data);
        setProfile(data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setIsLoadingProfile(false);
      }
    }

    fetchAnnouncements();
    fetchReportingStructure();
    fetchProfile();
  }, []);

  function formatRole(role: string) {
    return role.replace(/_/g, ' ').replace(/\w\S*/g, (txt) => {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  }

  function getRoleBadgeClass(role: string) {
    switch(role) {
      case 'EXECUTIVE_DIRECTOR':
        return 'bg-green-100 text-green-800 hover:bg-green-200 transition-colors';
      case 'DIRECTOR':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors';
      case 'JOINT_DIRECTOR':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200 transition-colors';
      case 'FIELD_OFFICER':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-200 transition-colors';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors';
    }
  }

  // Custom Role Badge component to avoid default hover styles
  function RoleBadge({ role, className }: { role: string, className?: string }) {
    const baseStyles = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold";
    
    const roleStyles = getRoleBadgeClass(role);
    
    return (
      <span className={cn(baseStyles, roleStyles, className)}>
        {formatRole(role)}
      </span>
    );
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#3C5A3E] to-[#5A8C5E] rounded-xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-2xl font-bold mb-1">Welcome back, {profile?.user?.name?.split(' ')[0] || user?.name?.split(' ')[0] || "Employee"}</h1>
            <p className="text-green-100">
              {formatDate(currentDate)}
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <div>
              <p className="text-sm font-medium">{profile?.employee?.id || reportingStructure?.self?.id || "Loading..."}</p>
              <p className="text-xs text-green-200">{profile?.employee?.employeeRole ? formatRole(profile.employee.employeeRole) : reportingStructure?.self?.role ? formatRole(reportingStructure.self.role) : "Employee"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content - Left Column (2/3 width on desktop) */}
        <div className="space-y-6 md:col-span-2">
          {/* Profile Summary Card - Moved to top */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Briefcase className="mr-2 h-5 w-5 text-[#3C5A3E]" />
                Profile Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingProfile ? (
                <div className="flex items-center mb-4">
                  <Skeleton className="h-16 w-16 rounded-full mr-4" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              ) : (
                <div className="flex items-center mb-4">
                  <Avatar className="h-16 w-16 mr-4 bg-[#3C5A3E]">
                    {profile?.user?.profileImage ? (
                      <AvatarImage src={profile.user.profileImage} alt="Profile" />
                    ) : (
                      <AvatarFallback className="text-white text-xl">
                        {profile?.user?.name ? getInitials(profile.user.name) : user?.name ? getInitials(user.name) : "U"}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="overflow-hidden">
                    <p className="font-medium text-lg truncate">{profile?.user?.name || user?.name || "Loading..."}</p>
                    <RoleBadge 
                      role={profile?.employee?.employeeRole || reportingStructure?.self?.role || ''}
                      className="mt-1"
                    />
                  </div>
                </div>
              )}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Employee ID</span>
                  <span className="text-sm font-medium text-right">{profile?.employee?.id || reportingStructure?.self?.id || "Loading..."}</span>
                </div>
                <Link href="/employee/profile" className="block">
                  <Button variant="outline" className="w-full mt-2">View Full Profile</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Announcements Card - Moved below profile */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-xl flex items-center">
                  <Bell className="mr-2 h-5 w-5 text-[#3C5A3E]" />
                  Announcements
                </CardTitle>
                <CardDescription>Latest updates from management</CardDescription>
              </div>
              <Link href="/employee/announcements">
                <Button variant="ghost" size="sm" className="text-[#3C5A3E]">
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {isLoadingAnnouncements ? (
                <div className="space-y-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : announcements.length > 0 ? (
                <div className="space-y-4">
                  {announcements.map(announcement => (
                    <div key={announcement.id} className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-[#3C5A3E]">{announcement.title}</h3>
                        <Badge variant="outline" className="text-xs">
                          {new Date(announcement.createdAt).toLocaleDateString()}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-3">{announcement.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Bell className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No announcements available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Right Column (1/3 width on desktop) */}
        <div className="space-y-6">
          {/* Reporting Structure Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Network className="mr-2 h-5 w-5 text-[#3C5A3E]" />
                Reporting Structure
              </CardTitle>
              <CardDescription>Your team hierarchy</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingReporting ? (
                <div className="space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : reportingStructure ? (
                <div className="space-y-6">
                  {/* Manager Section */}
                  {reportingStructure.manager && (
                    <div>
                      <h3 className="text-sm font-medium mb-2 text-[#3C5A3E]">You Report To</h3>
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Avatar className="h-8 w-8 mr-3 bg-[#3C5A3E]/10">
                              <AvatarFallback className="text-[#3C5A3E]">
                                {getInitials(reportingStructure.manager.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{reportingStructure.manager.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {reportingStructure.manager.email}
                              </p>
                            </div>
                          </div>
                          <RoleBadge role={reportingStructure.manager.role} />
                        </div>
                      </div>
                      
                      {/* Manager's Manager (if exists) */}
                      {reportingStructure.managerOfManager && (
                        <div className="mt-2 ml-4 border-l-2 border-gray-200 pl-4 pt-2">
                          <p className="text-xs text-muted-foreground mb-1">Who reports to</p>
                          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <Avatar className="h-8 w-8 mr-3 bg-[#3C5A3E]/10">
                                  <AvatarFallback className="text-[#3C5A3E]">
                                    {getInitials(reportingStructure.managerOfManager.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{reportingStructure.managerOfManager.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {reportingStructure.managerOfManager.email}
                                  </p>
                                </div>
                              </div>
                              <RoleBadge role={reportingStructure.managerOfManager.role} />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Direct Reports Section */}
                  {reportingStructure.directReports.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium mb-2 text-[#3C5A3E]">Reports To You</h3>
                      <div className="space-y-2">
                        {reportingStructure.directReports.map(report => (
                          <div key={report.id} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <Avatar className="h-8 w-8 mr-3 bg-[#3C5A3E]/10">
                                  <AvatarFallback className="text-[#3C5A3E]">
                                    {getInitials(report.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{report.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {report.email}
                                  </p>
                                </div>
                              </div>
                              <RoleBadge role={report.role} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No Manager or Reports */}
                  {!reportingStructure.manager && reportingStructure.directReports.length === 0 && (
                    <div className="text-center py-6">
                      <Network className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No reporting structure defined</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Network className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Unable to load reporting structure</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
