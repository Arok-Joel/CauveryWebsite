'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';

export default function EmployeeDashboard() {
  const { user } = useAuth();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Welcome Back</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">{user?.name}</p>
          <p className="text-sm text-muted-foreground">Employee ID: EMP-001</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">98%</p>
          <p className="text-sm text-muted-foreground">Last 30 days</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Next Shift</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">Morning</p>
          <p className="text-sm text-muted-foreground">6:00 AM - 2:00 PM</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Announcements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="font-medium">Monthly Team Meeting</p>
              <p className="text-sm text-muted-foreground">
                Join us for the monthly team meeting this Friday at 10 AM.
              </p>
            </div>
            <div>
              <p className="font-medium">Safety Training</p>
              <p className="text-sm text-muted-foreground">
                Mandatory safety training scheduled for next week.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="font-medium">Complete Safety Checklist</p>
              <p className="text-sm text-muted-foreground">Due: Today</p>
            </div>
            <div>
              <p className="font-medium">Submit Weekly Report</p>
              <p className="text-sm text-muted-foreground">Due: Friday</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <button className="w-full text-left hover:bg-gray-100 p-2 rounded-lg transition-colors">
              View Schedule
            </button>
            <button className="w-full text-left hover:bg-gray-100 p-2 rounded-lg transition-colors">
              Request Time Off
            </button>
            <button className="w-full text-left hover:bg-gray-100 p-2 rounded-lg transition-colors">
              Submit Feedback
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
