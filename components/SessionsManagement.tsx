'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, Shield, X } from 'lucide-react';

interface Session {
  id: string;
  userAgent: string;
  ipAddress: string;
  lastActive: string;
  createdAt: string;
  isCurrent: boolean;
}

export function SessionsManagement({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);

  useEffect(() => {
    if (open) {
      fetchSessions();
    }
  }, [open]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/sessions', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }

      const data = await response.json();
      setSessions(data.sessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to fetch sessions');
    } finally {
      setLoading(false);
    }
  };

  const revokeSession = async (sessionId: string) => {
    try {
      setRevoking(sessionId);
      const response = await fetch('/api/auth/sessions/revoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'revoke',
          sessionId,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to revoke session');
      }

      toast.success('Session revoked successfully');
      fetchSessions();
    } catch (error) {
      console.error('Error revoking session:', error);
      toast.error('Failed to revoke session');
    } finally {
      setRevoking(null);
    }
  };

  const revokeAllOtherSessions = async () => {
    try {
      setRevokingAll(true);
      const response = await fetch('/api/auth/sessions/revoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'revoke_all_except_current',
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to revoke sessions');
      }

      toast.success('All other sessions revoked successfully');
      fetchSessions();
    } catch (error) {
      console.error('Error revoking sessions:', error);
      toast.error('Failed to revoke sessions');
    } finally {
      setRevokingAll(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Manage Sessions</DialogTitle>
          <DialogDescription>
            View and manage your active sessions across different devices.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="mb-4">
              <Button
                variant="destructive"
                onClick={revokeAllOtherSessions}
                disabled={revokingAll || sessions.filter(s => !s.isCurrent).length === 0}
                className="w-full sm:w-auto"
              >
                {revokingAll ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Revoking...
                  </>
                ) : (
                  'Sign out from all other devices'
                )}
              </Button>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Device / Browser</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                        No active sessions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    sessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            {session.isCurrent && (
                              <Shield className="h-4 w-4 mr-2 text-green-500" />
                            )}
                            <div>
                              <div>{session.userAgent || 'Unknown device'}</div>
                              {session.isCurrent && (
                                <div className="text-xs text-green-500 font-medium">Current session</div>
                              )}
                              <div className="text-xs text-muted-foreground">
                                Active since {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{session.ipAddress || 'Unknown'}</TableCell>
                        <TableCell>
                          {formatDistanceToNow(new Date(session.lastActive), { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          {session.isCurrent ? (
                            <span className="text-xs text-muted-foreground">Current</span>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => revokeSession(session.id)}
                              disabled={revoking === session.id}
                            >
                              {revoking === session.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <X className="h-4 w-4" />
                              )}
                              <span className="sr-only">Revoke</span>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
} 