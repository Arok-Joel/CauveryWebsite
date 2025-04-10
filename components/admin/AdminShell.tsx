'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  Users, 
  Map, 
  BarChart2, 
  Settings, 
  LogOut, 
  FileImage
} from 'lucide-react';

interface AdminShellProps {
  children: React.ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: Home },
    { href: '/admin/plots', label: 'Plots', icon: Map },
    { href: '/admin/sales', label: 'Sales', icon: BarChart2 },
    { href: '/admin/teams', label: 'Teams', icon: Users },
    { href: '/admin/images', label: 'Images', icon: FileImage },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow pt-5 bg-white border-r overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4 mb-5">
            <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
          </div>
          <nav className="mt-5 flex-1 px-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    className={`w-full justify-start ${
                      isActive ? 'bg-gray-100 text-black hover:bg-gray-200' : ''
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <Link href="/">
              <Button variant="outline" className="w-full justify-start">
                <LogOut className="mr-3 h-5 w-5" />
                Back to Website
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Mobile header */}
        <div className="md:hidden border-b bg-white px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold">Admin Panel</h1>
          {/* Mobile menu button */}
        </div>
        
        {/* Content area */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
} 