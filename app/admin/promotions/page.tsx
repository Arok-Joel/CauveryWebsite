'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Milestone, Check, X, Calendar, ArrowUp } from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDistance } from 'date-fns';

interface Employee {
  id: string;
  employeeRole: string;
  user: {
    name: string;
    email: string;
    phone: string;
  };
}

interface PromotionRequest {
  id: string;
  employeeId: string;
  currentRole: string;
  targetRole: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  condition: string;
  createdAt: string;
  updatedAt: string;
  reviewedAt: string | null;
  reviewedById: string | null;
  reviewedBy: {
    name: string;
    email: string;
  } | null;
  employee: Employee;
}

export default function AdminPromotionsPage() {
  const [promotionRequests, setPromotionRequests] = useState<PromotionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);

  useEffect(() => {
    fetchPromotionRequests();
  }, []);

  async function fetchPromotionRequests() {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/promotions', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch promotion requests');
      }

      const data = await response.json();
      setPromotionRequests(data.promotionRequests);
    } catch (error) {
      console.error('Error fetching promotion requests:', error);
      toast.error('Failed to fetch promotion requests');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleProcessRequest(id: string, status: 'APPROVED' | 'REJECTED') {
    try {
      setProcessingRequest(id);
      const response = await fetch(`/api/admin/promotions/${id}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process promotion request');
      }

      const data = await response.json();
      toast.success(`Promotion request ${status.toLowerCase()} successfully`);
      
      // Update the local state
      setPromotionRequests(prev => 
        prev.map(req => 
          req.id === id ? { ...req, status, reviewedAt: new Date().toISOString() } : req
        )
      );
    } catch (error) {
      console.error('Error processing promotion request:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process promotion request');
    } finally {
      setProcessingRequest(null);
    }
  }

  function formatRole(role: string) {
    return role.replace(/_/g, ' ').replace(/\w\S*/g, (txt) => {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Approved</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  }
  
  function formatDate(dateString: string | null) {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  function getTimeAgo(dateString: string) {
    const date = new Date(dateString);
    return formatDistance(date, new Date(), { addSuffix: true });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Milestone className="mr-2 h-5 w-5" />
            Promotion Requests
          </CardTitle>
          <CardDescription>
            Manage employee promotion requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : promotionRequests.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Current Role</TableHead>
                    <TableHead>Promotion To</TableHead>
                    <TableHead>Condition Met</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promotionRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{request.employee?.user?.name || 'Unknown'}</div>
                          <div className="text-xs text-muted-foreground">{request.employeeId}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-gray-100">
                          {formatRole(request.currentRole)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <ArrowUp className="h-3 w-3 text-green-600" />
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            {formatRole(request.targetRole)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{request.condition}</span>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(request.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {getTimeAgo(request.createdAt)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {request.status === 'PENDING' ? (
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="default"
                              className="h-8 bg-green-600 hover:bg-green-700"
                              onClick={() => handleProcessRequest(request.id, 'APPROVED')}
                              disabled={processingRequest === request.id}
                            >
                              <Check className="h-4 w-4 mr-1" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-8"
                              onClick={() => handleProcessRequest(request.id, 'REJECTED')}
                              disabled={processingRequest === request.id}
                            >
                              <X className="h-4 w-4 mr-1" /> Reject
                            </Button>
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground">
                            {request.reviewedAt ? (
                              <span>
                                Processed {formatDate(request.reviewedAt)}
                              </span>
                            ) : 'Processed'}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <Milestone className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">No promotion requests available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 