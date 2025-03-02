'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';
import { useEffect, useState } from 'react';
import { 
  LayoutDashboard, 
  User, 
  Bell, 
  Menu,
  X
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

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

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser, loading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Protect employee routes
  useEffect(() => {
    if (!loading && (!user || user.role !== 'EMPLOYEE')) {
      router.push('/auth/employee/login');
    }
  }, [user, router, loading]);

  // Fetch profile data
  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;
      
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

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-[#3C5A3E] border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-[#3C5A3E] font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, don't show anything while redirecting
  if (!user || user.role !== 'EMPLOYEE') {
    return null;
  }

  const navigation = [
    {
      name: 'Dashboard',
      href: '/employee/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Profile',
      href: '/employee/profile',
      icon: User,
    },
    {
      name: 'Announcements',
      href: '/employee/announcements',
      icon: Bell,
    },
  ];

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }

      setUser(null);
      toast.success('Logged out successfully');
      router.push('/auth/employee/login');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  // Use profile data if available, otherwise fall back to auth context
  const displayName = profile?.user?.name || user?.name || '';
  const profileImage = profile?.user?.profileImage;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Mobile Header */}
      <header className="lg:hidden bg-white border-b border-gray-200 py-3 px-4 flex justify-between items-center">
        <div className="flex items-center">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="mr-2">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[250px] p-0">
              <div className="bg-[#3C5A3E] text-white p-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">Employee Portal</h2>
                  <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)} className="text-white">
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              <nav className="mt-2">
                {navigation.map(item => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-4 py-3 text-sm ${
                      pathname === item.href
                        ? 'bg-green-50 text-[#3C5A3E] font-medium border-l-4 border-[#3C5A3E]'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
          <h1 className="text-lg font-bold text-[#3C5A3E]">Royal Cauvery Farms</h1>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 bg-white border-r border-gray-200">
          <div className="p-6">
            <h1 className="text-xl font-bold text-[#3C5A3E]">Royal Cauvery Farms</h1>
            <p className="text-sm text-gray-500 mt-1">Employee Portal</p>
          </div>
          <nav className="mt-6 px-3">
            {navigation.map(item => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-2 rounded-lg mb-1 ${
                  pathname === item.href
                    ? 'bg-green-50 text-[#3C5A3E] font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.name}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {/* Desktop Page Header */}
            <header className="hidden lg:flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-800">
                {navigation.find(item => item.href === pathname)?.name || 'Employee'}
              </h1>
            </header>
            
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
