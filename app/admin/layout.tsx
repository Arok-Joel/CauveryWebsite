'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useEffect, useState } from 'react';
import { 
  Loader2, 
  LayoutDashboard, 
  Users, 
  Award,
  Menu,
  X,
  DollarSign,
  Network,
  Bell,
  MessagesSquare,
  Map,
  Store,
  LogOut,
  User,
  UserMinus
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { toast } from 'sonner';
import '../styles/admin-layout.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser, loading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Redirect if not authenticated or not an admin
  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-[#3C5A3E] border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-[#3C5A3E] font-medium">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  // If not authenticated and not loading, don't render anything
  // (will be redirected by the useEffect)
  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  const navigation = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: LayoutDashboard,
    },
    {
      name: 'Teams',
      href: '/admin/teams',
      icon: Network,
    },
    {
      name: 'Employees',
      href: '/admin/employees',
      icon: Users,
    },
    {
      name: 'Terminated Employees',
      href: '/admin/terminated-employees',
      icon: UserMinus,
    },
    {
      name: 'Promotions',
      href: '/admin/promotions',
      icon: Award,
    },
    {
      name: "Plots",
      href: "/admin/plots",
      icon: Map,
    },
    {
      name: "Book Plots",
      href: "/plots",
      icon: Store,
    },
    {
      name: 'Sales',
      href: '/admin/sales',
      icon: DollarSign,
    },
    {
      name: 'Announcements',
      href: '/admin/announcements',
      icon: Bell,
    },
    {
      name: "Messages",
      href: "/admin/messages",
      icon: MessagesSquare,
    },
    {
      name: "Profile",
      href: "/admin/profile",
      icon: User,
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
      router.push('/auth/login');
    } catch (error) {
      toast.error('Failed to logout');
    }
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
                  <h2 className="text-xl font-bold">Admin Portal</h2>
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
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  Logout
                </button>
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
            <p className="text-sm text-gray-500 mt-1">Admin Portal</p>
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
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-2 rounded-lg mb-1 text-gray-700 hover:bg-gray-100"
            >
              <LogOut className="h-5 w-5 mr-3" />
              Logout
            </button>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {/* Desktop Page Header */}
            <header className="hidden lg:flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-800">
                {navigation.find(item => item.href === pathname)?.name || 'Admin'}
              </h1>
            </header>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
