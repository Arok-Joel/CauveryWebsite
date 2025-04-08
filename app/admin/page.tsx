'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users, UserPlus, ShoppingCart, TrendingUp, ActivitySquare, IndianRupee } from 'lucide-react';
import { toast } from 'sonner';

interface DashboardMetrics {
  overall: {
    totalUsers: number;
    totalSales: number;
    conversionRate: string;
    totalRevenue: number;
  };
  monthly: {
    newUsers: number;
    sales: number;
    conversionRate: string;
    revenue: number;
  };
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/admin/dashboard-metrics');
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API response error:', response.status, errorText);
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch (e) {
            throw new Error(`HTTP error! status: ${response.status}, Response: ${errorText}`);
          }
          throw new Error(errorData?.details || `HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setMetrics(data);
      } catch (error: any) {
        console.error('Error fetching metrics:', error);
        toast.error(`Failed to load dashboard metrics: ${error.message || 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Royal Cauvery Farms</h1>
        <p className="text-gray-600">
          Manage your teams, employees, plots, and sales from this admin dashboard.
        </p>
      </div>
      
      {/* Metrics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="admin-stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="admin-stat-title">Total Users</p>
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              ) : (
                <p className="admin-stat-value">{metrics?.overall?.totalUsers || 0}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">Registered users</p>
            </div>
            <div className="admin-stat-icon">
              <Users className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="admin-stat-title">Monthly New Users</p>
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              ) : (
                <p className="admin-stat-value">{metrics?.monthly?.newUsers || 0}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">New users this month</p>
            </div>
            <div className="admin-stat-icon">
              <UserPlus className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="admin-stat-title">Total Plot Sales</p>
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              ) : (
                <p className="admin-stat-value">{metrics?.overall?.totalSales || 0}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">Total plots sold</p>
            </div>
            <div className="admin-stat-icon">
              <ShoppingCart className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="admin-stat-title">Monthly Plot Sales</p>
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              ) : (
                <p className="admin-stat-value">{metrics?.monthly?.sales || 0}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">Plots sold this month</p>
            </div>
            <div className="admin-stat-icon">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="admin-stat-title">Total Revenue</p>
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              ) : (
                <p className="admin-stat-value">₹{metrics?.overall?.totalRevenue?.toLocaleString() || 0}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">Overall revenue</p>
            </div>
            <div className="admin-stat-icon">
              <IndianRupee className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="admin-stat-title">Conversion Rate</p>
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              ) : (
                <p className="admin-stat-value">{metrics?.overall?.conversionRate || '0'}%</p>
              )}
              <p className="text-xs text-gray-500 mt-1">User to sales conversion</p>
            </div>
            <div className="admin-stat-icon">
              <ActivitySquare className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
