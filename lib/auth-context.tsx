'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type User = {
  email: string;
  name: string;
  role: string;
  id?: string;
} | null;

type AuthContextType = {
  user: User;
  setUser: (user: User) => void;
  checkAuth: () => Promise<void>;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<number>(0);

  const checkAuth = async (force = false) => {
    try {
      // Only check if forced or if it's been more than 30 seconds since the last check
      const now = Date.now();
      if (!force && lastChecked && now - lastChecked < 30000) {
        return;
      }
      
      setLoading(true);
      const timestamp = Date.now(); // Add timestamp to prevent caching
      const response = await fetch(`/api/auth/check?t=${timestamp}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        // Only update if the user data has changed
        if (JSON.stringify(data.user) !== JSON.stringify(user)) {
          console.log('User data changed, updating state:', data.user);
          setUser(data.user);
        }
      }
      
      setLastChecked(now);
    } catch (error) {
      console.error('Failed to check auth status:', error);
    } finally {
      // Add a small delay before setting loading to false
      // This helps prevent UI flashing by ensuring DOM updates are batched
      setTimeout(() => {
        setLoading(false);
      }, 100);
    }
  };

  // Check auth on initial load
  useEffect(() => {
    checkAuth(true);
  }, []);

  // Set up periodic auth checks every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      checkAuth();
    }, 30000);

    return () => clearInterval(interval);
  }, [lastChecked]);

  // Also check auth on window focus
  useEffect(() => {
    const handleFocus = () => {
      checkAuth();
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [lastChecked]);

  return (
    <AuthContext.Provider value={{ user, setUser, checkAuth, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
