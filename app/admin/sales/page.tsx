'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LabelList } from 'recharts';
import { Loader2, TrendingUp, IndianRupee, LineChart, ShoppingCart, ChevronDown, LayoutGrid, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { format } from 'date-fns';

interface SalesData {
  totalSales: number;
  totalRevenue: number;
  data: {
    label: string;
    count: number;
    revenue: number;
  }[];
  soldPlots: Array<{
    id: string;
    plotNumber: string;
    customerName: string;
    price: string;
    soldAt: string;
    size: string;
    dimensions: string;
    facing: string;
    plotAddress: string;
    phoneNumber: string;
    email: string;
    address: string;
    aadhaarNumber: string;
    employeeName: string;
    employeeRole?: string;
  }>;
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

      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Company Sold Plots Overview</CardTitle>
            </div>
            {!isLoading && (
              <div className="flex items-center gap-12">
                <div>
                  <p className="text-sm text-muted-foreground">Total Plots Sold</p>
                  <p className="text-xl font-bold">{salesData?.totalSales || 0} plots</p>
                </div>
                <div className="border-l pl-12">
                  <p className="text-sm text-muted-foreground">Total Revenue Generated</p>
                  <p className="text-xl font-bold text-green-600">₹{salesData?.totalRevenue.toLocaleString() || 0}</p>
                </div>
                <div className="border-l pl-12">
                  <p className="text-sm text-muted-foreground">Average Revenue Per Plot</p>
                  <p className="text-xl font-bold text-green-600">₹{calculateAverageRevenue(
                    salesData?.totalSales || 0,
                    salesData?.totalRevenue || 0
                  ).toLocaleString()}</p>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : salesData?.soldPlots && salesData.soldPlots.length > 0 ? (
            <div className="space-y-6">
              <div className="grid grid-cols-[1fr_1fr_1fr_1fr_40px] gap-6 items-center py-2 border-b">
                <div className="font-semibold text-muted-foreground">Plot Number</div>
                <div className="text-center font-semibold text-muted-foreground">Employee</div>
                <div className="text-center font-semibold text-muted-foreground">Price</div>
                <div className="font-semibold text-muted-foreground">Sale Date</div>
                <div></div>
              </div>
              {salesData.soldPlots.map((plot) => (
                <Collapsible key={plot.id}>
                  <div className="grid grid-cols-[1fr_1fr_1fr_1fr_40px] gap-6 items-center py-3 group">
                    <div className="font-medium">{plot.plotNumber}</div>
                    <div className="text-center">
                      <div className="font-medium">{plot.employeeName}</div>
                      <div className="text-sm text-muted-foreground">
                        {plot.employeeRole?.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
                      </div>
                    </div>
                    <div className="text-center text-green-600 font-medium">₹{parseFloat(plot.price).toLocaleString()}</div>
                    <div className="font-medium">{format(new Date(plot.soldAt), 'MMM d, yyyy')}</div>
                    <div className="flex justify-end">
                      <CollapsibleTrigger className="h-6 w-6 p-1 hover:bg-muted rounded">
                        <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                      </CollapsibleTrigger>
                    </div>
                  </div>
                  <CollapsibleContent>
                    <div className="border-t bg-muted/50 py-4">
                      <div className="px-6">
                        <div className="grid grid-cols-2 gap-8">
                          {/* Plot Details */}
                          <div>
                            <h4 className="font-semibold mb-4 flex items-center gap-2 text-sm">
                              <LayoutGrid className="h-4 w-4 text-muted-foreground" />
                              Plot Details
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-muted-foreground">Size</p>
                                <p className="font-medium">{plot.size} sq ft</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Price</p>
                                <p className="font-medium">₹{parseFloat(plot.price).toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Dimensions</p>
                                <p className="font-medium">{plot.dimensions}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Facing</p>
                                <p className="font-medium">{plot.facing}</p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-sm text-muted-foreground">Address</p>
                                <p className="font-medium">{plot.plotAddress}</p>
                              </div>
                            </div>
                          </div>

                          {/* Customer Details */}
                          <div>
                            <h4 className="font-semibold mb-4 flex items-center gap-2 text-sm">
                              <UserCheck className="h-4 w-4 text-muted-foreground" />
                              Customer Details
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-muted-foreground">Name</p>
                                <p className="font-medium">{plot.customerName}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Phone</p>
                                <p className="font-medium">{plot.phoneNumber}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Email</p>
                                <p className="font-medium">{plot.email}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Aadhaar</p>
                                <p className="font-medium">{plot.aadhaarNumber}</p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-sm text-muted-foreground">Address</p>
                                <p className="font-medium">{plot.address}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                <ShoppingCart className="h-6 w-6 text-gray-500" />
              </div>
              <h3 className="mt-4 text-lg font-medium">No Sold Plots</h3>
              <p className="mt-2 text-sm text-gray-500">
                There are no sold plots to display.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 