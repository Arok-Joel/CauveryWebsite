import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

// Simple helper to verify auth from cookies
export async function handleAuth(request: Request): Promise<any> {
  try {
    // Get cookies from the request headers
    const cookieHeader = request.headers.get('cookie') || '';
    const tokenCookie = cookieHeader
      .split(';')
      .map(cookie => cookie.trim())
      .find(cookie => cookie.startsWith('token='));
    
    const token = tokenCookie ? tokenCookie.split('=')[1] : null;
    
    if (!token) {
      return null;
    }
    
    // Verify the token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || '');
    
    try {
      const { payload } = await jwtVerify(token, secret);
      return payload;
    } catch (error) {
      console.error('Token verification failed:', error);
      return null;
    }
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
} 