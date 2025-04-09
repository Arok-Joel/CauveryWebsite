import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Check authentication
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ 
        error: 'No auth token found',
        tokenExists: false
      }, { status: 401 });
    }
    
    const verified = await verifyAuth(token);
    
    // Check if user is authenticated and is an admin
    if (!verified) {
      return NextResponse.json({ 
        error: 'Authentication failed',
        tokenExists: true,
        verified: false,
      }, { status: 401 });
    }
    
    if (verified.role !== 'ADMIN') {
      return NextResponse.json({ 
        error: 'Not an admin user',
        tokenExists: true,
        verified: true,
        role: verified.role
      }, { status: 403 });
    }
    
    // Try to perform a simple Prisma operation to check database connectivity
    // Get all model names from Prisma schema
    const modelNames = Object.keys(db).filter(key => 
      !['$on', '$connect', '$disconnect', '$use', '$transaction', '$extends'].includes(key)
    );
    
    // Check if our models exist in the Prisma client
    const hasAdminContactInfo = modelNames.includes('adminContactInfo');
    const hasPhoneNumber = modelNames.includes('phoneNumber');
    
    // Try to get contact info if model exists
    let contactInfoExists = false;
    let contactInfoDetails = null;
    
    if (hasAdminContactInfo) {
      try {
        const contactInfo = await db.adminContactInfo.findFirst({
          include: {
            phoneNumbers: true
          }
        });
        
        contactInfoExists = !!contactInfo;
        contactInfoDetails = contactInfo ? {
          id: contactInfo.id,
          emailSet: !!contactInfo.email,
          addressSet: !!contactInfo.address,
          phoneNumberCount: contactInfo.phoneNumbers?.length || 0,
          hasDefaultPhone: contactInfo.phoneNumbers?.some(p => p.isDefault) || false
        } : null;
      } catch (error) {
        console.error('Error checking contact info:', error);
      }
    }
    
    // Return debug information
    return NextResponse.json({
      success: true,
      auth: {
        tokenExists: true,
        verified: true,
        role: verified.role,
        user: verified
      },
      prisma: {
        modelNames,
        hasAdminContactInfo,
        hasPhoneNumber,
        contactInfoExists,
        contactInfoDetails
      },
      database: {
        provider: 'postgresql',
        url: process.env.DATABASE_URL ? '(configured)' : '(missing)',
      }
    });
    
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : null
    }, { status: 500 });
  }
} 