'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

interface Commission {
  plotId: string;
  plotNumber: string;
  saleAmount: number;
  commissionPercentage: number;
  commissionAmount: number;
  soldAt: string;
  customerName: string;
}

interface CommissionsData {
  employee: {
    id: string;
    name: string;
    role: string;
  };
  commissions: Commission[];
  totalCommission: number;
  totalSales: number;
}

export default function CommissionsPage() {
  const [data, setData] = useState<CommissionsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCommissions = async () => {
      try {
        const response = await fetch('/api/employee/commissions');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch commissions');
        }
        
        const commissionData = await response.json();
        setData(commissionData);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to fetch commissions');
      } finally {
        setLoading(false);
      }
    };

    fetchCommissions();
  }, []);

  const formatPercentage = (percentage: number) => {
    return `${(percentage * 100).toFixed(0)}%`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-32" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data || data.commissions.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Commissions</CardTitle>
            <CardDescription>
              View your sales commissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <h3 className="text-lg font-medium">No commissions found</h3>
              <p className="text-muted-foreground mt-2">
                You haven't earned any commissions yet. Start selling plots to earn commissions!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Commissions</CardTitle>
          <CardDescription>
            View your sales commissions as {data.employee.role.replace('_', ' ')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Commission
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(data.totalCommission)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Sales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.totalSales}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Commission Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatPercentage(data.commissions[0]?.commissionPercentage || 0)}
                </div>
              </CardContent>
            </Card>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plot Number</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Sale Date</TableHead>
                <TableHead>Sale Amount</TableHead>
                <TableHead>Commission %</TableHead>
                <TableHead className="text-right">Commission Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.commissions.map((commission) => (
                <TableRow key={commission.plotId}>
                  <TableCell className="font-medium">{commission.plotNumber}</TableCell>
                  <TableCell>{commission.customerName}</TableCell>
                  <TableCell>{formatDate(commission.soldAt)}</TableCell>
                  <TableCell>{formatCurrency(commission.saleAmount)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {formatPercentage(commission.commissionPercentage)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(commission.commissionAmount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 