"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Home, TrendingUp, UserPlus, LineChart, BarChart } from 'lucide-react';

interface DashboardMetrics {
  overall: {
    totalUsers: number;
    totalSales: number;
    totalRevenue: number;
    conversionRate: string;
  };
  monthly: {
    newUsers: number;
    sales: number;
    revenue: number;
    conversionRate: string;
  };
}

export function DashboardMetrics() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/admin/dashboard-metrics');
        const data = await response.json();
        setMetrics(data);
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (loading) {
    return <div>Loading metrics...</div>;
  }

  if (!metrics) {
    return <div>Failed to load metrics</div>;
  }

  const cards = [
    {
      title: "Total Registered Users",
      value: metrics.overall.totalUsers,
      icon: Users,
      description: "Overall user registrations"
    },
    {
      title: "New Users This Month",
      value: metrics.monthly.newUsers,
      icon: UserPlus,
      description: "Monthly registrations"
    },
    {
      title: "Total Plot Sales",
      value: metrics.overall.totalSales,
      icon: Home,
      description: "Overall plots sold"
    },
    {
      title: "Monthly Plot Sales",
      value: metrics.monthly.sales,
      icon: BarChart,
      description: "Plots sold this month"
    },
    {
      title: "Overall Conversion Rate",
      value: `${metrics.overall.conversionRate}%`,
      icon: TrendingUp,
      description: "User to sale conversion"
    },
    {
      title: "Monthly Conversion Rate",
      value: `${metrics.monthly.conversionRate}%`,
      icon: LineChart,
      description: "This month's conversion"
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {cards.map((card, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {card.title}
            </CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}