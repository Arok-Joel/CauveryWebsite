
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { UserX, Calendar, Briefcase, Mail } from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface TerminatedEmployee {
  id: string;
  name: string;
  email: string;
  role: string;
  terminationDate: string;
}

export default function TerminatedEmployeesPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [terminatedEmployees, setTerminatedEmployees] = useState<TerminatedEmployee[]>([]);

  useEffect(() => {
    fetchTerminatedEmployees();
  }, []);

  const fetchTerminatedEmployees = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/terminated-employees');
      
      if (!response.ok) {
        throw new Error('Failed to fetch terminated employees');
      }
      
      const data = await response.json();
      setTerminatedEmployees(data.employees);
    } catch (error) {
      console.error('Error fetching terminated employees:', error);
      toast.error('Failed to load terminated employees');
    } finally {
      setIsLoading(false);
    }
  };

  const formatRole = (role: string) => {
    return role.replace(/_/g, ' ');
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Terminated Employees</h1>
      
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserX className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Terminated Employee List</CardTitle>
          </div>
          <CardDescription>
            List of all employees who have been terminated from the organization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : terminatedEmployees.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Termination Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {terminatedEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <div className="font-medium">{employee.name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {employee.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        <div className="flex items-center gap-1">
                          <Briefcase className="h-3 w-3" />
                          {formatRole(employee.role)}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(employee.terminationDate), 'MMM d, yyyy')}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-8 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                <UserX className="h-6 w-6 text-gray-500" />
              </div>
              <h3 className="mt-4 text-lg font-medium">No Terminated Employees</h3>
              <p className="mt-2 text-sm text-gray-500">
                There are no terminated employees to display.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 