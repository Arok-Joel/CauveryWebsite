import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

// GET - Retrieve admin contact information for public display
export async function GET() {
  try {
    // Check if required models exist
    const modelNames = Object.keys(db).filter(key => 
      !['$on', '$connect', '$disconnect', '$use', '$transaction', '$extends'].includes(key)
    );
    
    const hasAdminContactInfo = modelNames.includes('adminContactInfo');
    const hasPhoneNumber = modelNames.includes('phoneNumber');
    
    if (!hasAdminContactInfo || !hasPhoneNumber) {
      console.error('Missing required models for contact info:', { hasAdminContactInfo, hasPhoneNumber });
      // Return empty data if models don't exist
      return NextResponse.json({ 
        id: '',
        address: '',
        email: '',
        phoneNumbers: []
      });
    }
    
    // Get the first admin contact info
    const adminContactInfo = await db.adminContactInfo.findFirst({
      include: {
        phoneNumbers: true,
      },
    });

    if (!adminContactInfo) {
      // Return empty structure when no data is found
      console.log('No admin contact info found, returning empty data');
      return NextResponse.json({ 
        id: '',
        address: '',
        email: '',
        phoneNumbers: []
      });
    }

    return NextResponse.json(adminContactInfo);
  } catch (error) {
    console.error('Error fetching admin contact info:', error);
    
    // Handle Prisma errors specifically
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === 'P2001' || error.code === 'P2021') {
        console.error('Database schema error in contact info API:', error.message);
      }
    }
    
    // Return empty data in case of any error
    return NextResponse.json({ 
      id: '',
      address: '',
      email: '',
      phoneNumbers: []
    });
  }
} 