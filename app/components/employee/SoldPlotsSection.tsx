'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { BadgeIndianRupee, ChevronDown, LayoutGrid, UserCheck, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface Commission {
  id: string;
  amount: string | number;
  percentage: string | number;
  soldPlot: {
    plotNumber: string;
    size: string;
    price: string;
    dimensions: string;
    facing: string;
    plotAddress: string;
    customerName: string;
    phoneNumber: string;
    email: string;
    address: string;
    aadhaarNumber: string;
    soldAt: string | Date;
  };
}

interface SoldPlotsSectionProps {
  initialCommissions: Commission[];
  employeeId: string;
}

export function SoldPlotsSection({ initialCommissions, employeeId }: SoldPlotsSectionProps) {
  const [commissions, setCommissions] = useState<Commission[]>(initialCommissions);
  const [isLoading, setIsLoading] = useState(false);
  const [plotsFilter, setPlotsFilter] = useState('lastMonth');

  const totalCommission = commissions.reduce((sum, commission) => 
    sum + parseFloat(commission.amount.toString()), 0
  );

  const fetchFilteredCommissions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/employee/${employeeId}/commissions?filter=${plotsFilter}`);
      if (!response.ok) throw new Error('Failed to fetch commissions');
      const data = await response.json();
      setCommissions(data.commissions);
    } catch (error) {
      console.error('Error fetching filtered commissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFilteredCommissions();
  }, [plotsFilter, employeeId]);

  return (
    <Card className="col-span-2 mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BadgeIndianRupee className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Sold Plots</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Select defaultValue="lastMonth" onValueChange={(value) => setPlotsFilter(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lastWeek">Last Week</SelectItem>
                <SelectItem value="lastMonth">Last Month</SelectItem>
                <SelectItem value="lastYear">Last Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {!isLoading && commissions.length > 0 && (
            <div className="flex items-center gap-12">
              <div>
                <p className="text-sm text-muted-foreground">Total Sales</p>
                <p className="text-xl font-bold">{commissions.length} plots</p>
              </div>
              <div className="border-l pl-12">
                <p className="text-sm text-muted-foreground">Total Commission</p>
                <p className="text-xl font-bold text-green-600">₹{totalCommission.toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : commissions.length > 0 ? (
          <div className="space-y-6">
            {commissions.map((commission) => (
              <Collapsible key={commission.id}>
                <div className="grid grid-cols-[1fr_1fr_1fr_1fr_40px] gap-6 items-center py-3 group">
                  <div className="font-medium">{commission.soldPlot.plotNumber}</div>
                  <div className="text-center text-green-600 font-medium">₹{parseFloat(commission.amount.toString()).toLocaleString()}</div>
                  <div className="text-center font-medium">{(parseFloat(commission.percentage.toString()) * 100).toFixed(1)}%</div>
                  <div className="font-medium">{format(new Date(commission.soldPlot.soldAt), 'MMM d, yyyy')}</div>
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
                              <p className="font-medium">{commission.soldPlot.size} sq ft</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Price</p>
                              <p className="font-medium">₹{parseFloat(commission.soldPlot.price).toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Dimensions</p>
                              <p className="font-medium">{commission.soldPlot.dimensions}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Facing</p>
                              <p className="font-medium">{commission.soldPlot.facing}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-sm text-muted-foreground">Address</p>
                              <p className="font-medium">{commission.soldPlot.plotAddress}</p>
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
                              <p className="font-medium">{commission.soldPlot.customerName}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Phone</p>
                              <p className="font-medium">{commission.soldPlot.phoneNumber}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Email</p>
                              <p className="font-medium">{commission.soldPlot.email}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Aadhaar</p>
                              <p className="font-medium">{commission.soldPlot.aadhaarNumber}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-sm text-muted-foreground">Address</p>
                              <p className="font-medium">{commission.soldPlot.address}</p>
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
              <BadgeIndianRupee className="h-6 w-6 text-gray-500" />
            </div>
            <h3 className="mt-4 text-lg font-medium">No Sold Plots</h3>
            <p className="mt-2 text-sm text-gray-500">
              No plots sold in the selected period.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 