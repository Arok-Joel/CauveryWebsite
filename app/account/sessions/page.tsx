'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, LogOut, Shield, Smartphone, Monitor, Tablet, Laptop, Computer } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { 
  getBrowserNameFromUserAgent, 
  getOSFromUserAgent, 
  getDeviceType,
  isMobileDevice 
} from '@/lib/utils';

interface Session {
  id: string;
  userAgent: string;
  ipAddress: string;
  createdAt: string;
  expires: string;
}

export default function SessionsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLogoutAllLoading, setIsLogoutAllLoading] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function fetchSessions() {
      try {
        const response = await fetch('/api/auth/sessions');
        if (response.ok) {
          const data = await response.json();
          setSessions(data.sessions);
        }
      } catch (error) {
        console.error('Failed to fetch sessions:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (user) {
      fetchSessions();
    }
  }, [user]);

  const handleLogoutAll = async () => {
    try {
      setIsLogoutAllLoading(true);
      const response = await fetch('/api/auth/logout-all', {
        method: 'POST',
      });

      if (response.ok) {
        router.push('/auth/login');
      }
    } catch (error) {
      console.error('Failed to logout from all devices:', error);
    } finally {
      setIsLogoutAllLoading(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Active Sessions</h1>
      <p className="text-muted-foreground mb-8">
        These are your currently active sessions across all devices. You can log out from all devices if you suspect unauthorized access.
      </p>

      <div className="mb-8">
        <Button 
          variant="destructive" 
          onClick={handleLogoutAll} 
          disabled={isLogoutAllLoading}
        >
          {isLogoutAllLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Logging out...
            </>
          ) : (
            <>
              <LogOut className="mr-2 h-4 w-4" />
              Logout from all devices
            </>
          )}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sessions.map((session) => (
            <Card key={session.id}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  {(() => {
                    const deviceType = getDeviceType(session.userAgent);
                    if (deviceType.includes('iPhone') || deviceType.includes('Android Phone')) {
                      return <Smartphone className="h-5 w-5 mr-2 text-primary" />;
                    } else if (deviceType.includes('iPad') || deviceType.includes('Tablet')) {
                      return <Tablet className="h-5 w-5 mr-2 text-primary" />;
                    } else if (deviceType.includes('Mac')) {
                      return <Laptop className="h-5 w-5 mr-2 text-primary" />;
                    } else if (deviceType.includes('PC') || deviceType.includes('Linux')) {
                      return <Computer className="h-5 w-5 mr-2 text-primary" />;
                    } else {
                      return <Monitor className="h-5 w-5 mr-2 text-primary" />;
                    }
                  })()}
                  {getBrowserNameFromUserAgent(session.userAgent)}
                </CardTitle>
                <CardDescription>
                  {getDeviceType(session.userAgent)} • {getOSFromUserAgent(session.userAgent)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">IP Address:</span> {session.ipAddress || 'Unknown'}
                  </div>
                  <div>
                    <span className="font-medium">Created:</span> {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
                  </div>
                  <div>
                    <span className="font-medium">Expires:</span> {formatDistanceToNow(new Date(session.expires), { addSuffix: true })}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <div className="text-xs text-muted-foreground break-all">
                  {session.userAgent || 'Unknown user agent'}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 