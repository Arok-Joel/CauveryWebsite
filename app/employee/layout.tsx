'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';
import { useEffect } from 'react';
import { 
  LayoutDashboard, 
  User, 
  Bell, 
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser, loading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Protect employee routes
  useEffect(() => {
    if (!loading && (!user || user.role !== 'EMPLOYEE')) {
      router.push('/auth/employee/login');
    }
  }, [user, router, loading]);

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
                <div className="flex items-center mt-4">
                  <Avatar className="h-10 w-10 mr-3 border-2 border-white">
                    <AvatarFallback className="bg-green-700 text-white">
                      {user?.name ? getInitials(user.name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="overflow-hidden">
                    <p className="font-medium truncate">{user?.name}</p>
                    <p className="text-sm text-green-200 truncate">{user?.email}</p>
                  </div>
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
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-[#3C5A3E] text-white">
            {user?.name ? getInitials(user.name) : 'U'}
          </AvatarFallback>
        </Avatar>
      </header>

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 bg-white border-r border-gray-200">
          <div className="p-6">
            <h1 className="text-xl font-bold text-[#3C5A3E]">Royal Cauvery Farms</h1>
            <p className="text-sm text-gray-500 mt-1">Employee Portal</p>
          </div>
          <div className="px-6 py-4 border-t border-b border-gray-200">
            <div className="flex items-center">
              <Avatar className="h-10 w-10 mr-3">
                <AvatarFallback className="bg-[#3C5A3E] text-white">
                  {user?.name ? getInitials(user.name) : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="overflow-hidden">
                <p className="font-medium truncate">{user?.name}</p>
                <p className="text-sm text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
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
