'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LabelList } from 'recharts';
import { Loader2, TrendingUp, IndianRupee, LineChart } from 'lucide-react';
import { toast } from 'sonner';

interface SalesData {
  totalSales: number;
  totalRevenue: number;
  data: {
    label: string;
    count: number;
    revenue: number;
  }[];
}

const getTimeFilterLabel = (filter: string) => {
  switch (filter) {
    case 'months':
      return 'Monthly Sales (Current Year)';
    case 'years':
      return 'Yearly Sales (Last 5 Years)';
    case 'quarters':
      return 'Quarterly Sales';
    default:
      return 'Sales Overview';
  }
};

export default function SalesPage() {
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [timeFilter, setTimeFilter] = useState('months');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSalesData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/admin/sales?timeFilter=${timeFilter}&t=${Date.now()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch sales data');
      }
      const data = await response.json();
      setSalesData(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch sales data';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [timeFilter]);

  useEffect(() => {
    fetchSalesData();
  }, [fetchSalesData]);

  const handleTimeFilterChange = (value: string) => {
    setTimeFilter(value);
    setIsLoading(true);
  };

  const calculateAverageRevenue = (sales: number, revenue: number) => {
    if (sales === 0) return 0;
    return revenue / sales;
  };

  const LoadingState = () => (
    <div className="flex items-center justify-center h-[400px]">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading sales data...</p>
      </div>
    </div>
  );

  const ErrorState = () => (
    <div className="flex items-center justify-center h-[400px]">
      <div className="flex flex-col items-center gap-2 text-destructive">
        <p>Failed to load sales data</p>
        <button
          onClick={fetchSalesData}
          className="text-sm underline hover:text-destructive/80"
        >
          Try again
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Select value={timeFilter} onValueChange={handleTimeFilterChange} disabled={isLoading}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="months">Monthly (This Year)</SelectItem>
            <SelectItem value="quarters">Quarterly (Q1-Q4)</SelectItem>
            <SelectItem value="years">Last 5 Years</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <LineChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">{salesData?.totalSales || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Total number of plots sold
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">₹{salesData?.totalRevenue.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Total revenue from sales
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  ₹{calculateAverageRevenue(
                    salesData?.totalSales || 0,
                    salesData?.totalRevenue || 0
                  ).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Average revenue per plot
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Performing Period</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {salesData?.data.reduce((max, item) => 
                    item.revenue > (max?.revenue || 0) ? item : max
                  , { label: 'None', revenue: 0 })?.label || 'None'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Highest revenue period
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>{getTimeFilterLabel(timeFilter)}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            {isLoading ? (
              <LoadingState />
            ) : error ? (
              <ErrorState />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={salesData?.data || []}
                  margin={{
                    top: 40,
                    right: 50,
                    left: 50,
                    bottom: 20,
                  }}
                  barGap={20}
                  barSize={60}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="label"
                    tick={{ fill: '#666' }}
                    axisLine={{ stroke: '#E5E7EB' }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fill: '#666' }}
                    label={{ value: 'Revenue (₹)', angle: -90, position: 'insideLeft', offset: -35 }}
                    axisLine={{ stroke: '#E5E7EB' }}
                    tickLine={false}
                    tickFormatter={(value) => `₹${(value/1000000).toFixed(1)}M`}
                  />
                  <Tooltip
                    formatter={(value: any) => ['₹' + parseInt(value).toLocaleString(), 'Revenue']}
                    cursor={{ fill: 'rgba(60, 90, 62, 0.1)' }}
                  />
                  <Bar 
                    dataKey="revenue"
                    fill="#3C5A3E"
                    name="Revenue"
                    radius={[4, 4, 0, 0]}
                  >
                    <LabelList 
                      dataKey="revenue" 
                      position="top" 
                      formatter={(value: number) => '₹' + (value/1000000).toFixed(1) + 'M'}
                      style={{ 
                        fill: '#666',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}
                      offset={10}
                      angle={0}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 