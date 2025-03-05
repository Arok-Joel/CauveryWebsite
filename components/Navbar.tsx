'use client';

import Link from 'next/link';
import { Button } from './ui/button';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Menu, User, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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

export function Navbar() {
  const router = useRouter();
  const { user, setUser, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Fetch profile data for employees
  useEffect(() => {
    async function fetchProfile() {
      if (!user || user.role !== 'EMPLOYEE') return;
      
      try {
        setIsLoadingProfile(true);
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
        setIsLoadingProfile(false);
      }
    }

    if (user && user.role === 'EMPLOYEE') {
      fetchProfile();
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to logout');
      }

      setUser(null);
      toast.success('Logged out successfully');
      router.push('/auth/login');
    } catch (error) {
      toast.error('Failed to logout');
    } finally {
      setIsLoading(false);
    }
  };

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];

  // Get display name based on role and profile data
  const getDisplayName = () => {
    if (user?.role === 'ADMIN') return 'Admin';
    if (user?.role === 'EMPLOYEE' && profile?.user?.name) return profile.user.name;
    return user?.name || '';
  };

  const displayName = getDisplayName();
  const profileImage = profile?.user?.profileImage;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <nav className="bg-[#3C5A3E] text-white py-4">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            Royal Cauvery Farms
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center">
            <div className="flex items-center gap-6 mr-4">
              {navigation.map(item => (
                <Link key={item.name} href={item.href} className="hover:text-white/80">
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Auth section with fixed width to prevent layout shifts */}
            <div className="w-[280px] flex justify-end">
              {loading ? (
                <div className="flex items-center justify-center gap-2 h-10 w-full">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  <span className="text-sm">Loading...</span>
                </div>
              ) : user ? (
                <div className="flex items-center gap-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="bg-white/10 text-white hover:bg-white/20 flex items-center"
                      >
                        {user.role === 'EMPLOYEE' && profileImage ? (
                          <Avatar className="h-6 w-6 mr-2">
                            <AvatarImage src={profileImage} alt="Profile" />
                          </Avatar>
                        ) : (
                          <User className="mr-2 h-4 w-4" />
                        )}
                        {displayName}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {user.role === 'ADMIN' && (
                        <DropdownMenuItem asChild>
                          <Link href="/admin">Admin Dashboard</Link>
                        </DropdownMenuItem>
                      )}
                      {user.role === 'EMPLOYEE' && (
                        <DropdownMenuItem asChild>
                          <Link href="/employee/dashboard">Employee Dashboard</Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem asChild>
                        <Link href="/account/sessions">Manage Sessions</Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button
                    onClick={handleLogout}
                    disabled={isLoading}
                    variant="outline"
                    className="bg-white/10 text-white hover:bg-white/20"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {isLoading ? 'Logging out...' : 'Logout'}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <Button
                    asChild
                    variant="outline"
                    className="bg-white/10 text-white hover:bg-white/20"
                  >
                    <Link href="/auth/login">Login</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="bg-white/10 text-white hover:bg-white/20"
                  >
                    <Link href="/auth/employee/register">Employee Register</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Navigation */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="md:hidden bg-white/10 text-white hover:bg-white/20"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col gap-4">
                {navigation.map(item => (
                  <Link key={item.name} href={item.href} className="text-lg">
                    {item.name}
                  </Link>
                ))}

                {/* Fixed height container for auth elements to prevent layout shifts */}
                <div className="min-h-[120px]">
                  {loading ? (
                    <div className="flex items-center gap-2 py-4">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                      <span className="text-sm">Loading...</span>
                    </div>
                  ) : user ? (
                    <>
                      {user.role === 'ADMIN' && (
                        <Link href="/admin" className="text-lg">
                          Admin Dashboard
                        </Link>
                      )}
                      {user.role === 'EMPLOYEE' && (
                        <Link href="/employee/dashboard" className="text-lg flex items-center gap-2">
                          {profileImage ? (
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={profileImage} alt="Profile" />
                            </Avatar>
                          ) : (
                            <User className="h-4 w-4" />
                          )}
                          Employee Dashboard
                        </Link>
                      )}
                      <Link href="/account/sessions" className="text-lg">
                        Manage Sessions
                      </Link>
                      <Button
                        onClick={handleLogout}
                        disabled={isLoading}
                        variant="outline"
                        className="w-full"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        {isLoading ? 'Logging out...' : 'Logout'}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button asChild variant="outline" className="w-full">
                        <Link href="/auth/login">Login</Link>
                      </Button>
                      <Button asChild variant="outline" className="w-full">
                        <Link href="/auth/employee/register">Employee Register</Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
