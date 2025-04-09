import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

// Helper function to check if required models exist
function checkRequiredModels() {
  const modelNames = Object.keys(db).filter(key => 
    !['$on', '$connect', '$disconnect', '$use', '$transaction', '$extends'].includes(key)
  );
  
  const hasAdminContactInfo = modelNames.includes('adminContactInfo');
  const hasPhoneNumber = modelNames.includes('phoneNumber');
  
  if (!hasAdminContactInfo || !hasPhoneNumber) {
    return {
      valid: false,
      message: `Missing required models: ${!hasAdminContactInfo ? 'adminContactInfo' : ''} ${!hasPhoneNumber ? 'phoneNumber' : ''}`.trim()
    };
  }
  
  return { valid: true, message: '' };
}

// GET - Retrieve admin contact information
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const verified = await verifyAuth(token);
    if (!verified || verified.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if required models exist
    const modelsCheck = checkRequiredModels();
    if (!modelsCheck.valid) {
      return NextResponse.json({ error: modelsCheck.message }, { status: 500 });
    }

    // Get the first admin contact info (there should be only one)
    const adminContactInfo = await db.adminContactInfo.findFirst({
      include: {
        phoneNumbers: true,
      },
    });

    if (!adminContactInfo) {
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
        return NextResponse.json(
          { error: 'Database schema error. Please run prisma generate and restart the server.' },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST - Create new admin contact information
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const verified = await verifyAuth(token);
    if (!verified || verified.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if required models exist
    const modelsCheck = checkRequiredModels();
    if (!modelsCheck.valid) {
      return NextResponse.json({ error: modelsCheck.message }, { status: 500 });
    }

    const data = await request.json();

    // Validate input data
    if (!data.address || !data.email || !Array.isArray(data.phoneNumbers) || data.phoneNumbers.length === 0) {
      return NextResponse.json(
        { error: 'Invalid input data. Address, email, and at least one phone number are required.' },
        { status: 400 }
      );
    }

    // Ensure at least one phone number is marked as default
    const hasDefault = data.phoneNumbers.some((phone: { isDefault: boolean }) => phone.isDefault);
    if (!hasDefault && data.phoneNumbers.length > 0) {
      data.phoneNumbers[0].isDefault = true;
    }

    // Check if admin contact info already exists
    const existing = await db.adminContactInfo.findFirst();
    if (existing) {
      return NextResponse.json(
        { error: 'Admin contact info already exists. Use PUT to update.' },
        { status: 400 }
      );
    }

    // Create admin contact info with phone numbers
    const newContactInfo = await db.adminContactInfo.create({
      data: {
        address: data.address,
        email: data.email,
        phoneNumbers: {
          create: data.phoneNumbers.map((phone: { number: string; isDefault: boolean }) => ({
            number: phone.number,
            isDefault: phone.isDefault,
          })),
        },
      },
      include: {
        phoneNumbers: true,
      },
    });

    return NextResponse.json(newContactInfo);
  } catch (error) {
    console.error('Error creating admin contact info:', error);
    
    // Handle Prisma errors specifically
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === 'P2001' || error.code === 'P2021') {
        return NextResponse.json(
          { error: 'Database schema error. Please run prisma generate and restart the server.' },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT - Update existing admin contact information
export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const verified = await verifyAuth(token);
    if (!verified || verified.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if required models exist
    const modelsCheck = checkRequiredModels();
    if (!modelsCheck.valid) {
      return NextResponse.json({ error: modelsCheck.message }, { status: 500 });
    }

    const data = await request.json();

    // Validate input data
    if (!data.address || !data.email || !Array.isArray(data.phoneNumbers) || data.phoneNumbers.length === 0) {
      return NextResponse.json(
        { error: 'Invalid input data. Address, email, and at least one phone number are required.' },
        { status: 400 }
      );
    }

    // Ensure at least one phone number is marked as default
    const hasDefault = data.phoneNumbers.some((phone: { isDefault: boolean }) => phone.isDefault);
    if (!hasDefault && data.phoneNumbers.length > 0) {
      data.phoneNumbers[0].isDefault = true;
    }

    // Find existing admin contact info
    const existingContactInfo = await db.adminContactInfo.findFirst();

    if (!existingContactInfo) {
      // If no existing info, create new one
      return await POST(request);
    }

    try {
      // Delete all existing phone numbers
      await db.phoneNumber.deleteMany({
        where: {
          adminContactInfoId: existingContactInfo.id,
        },
      });

      // Update admin contact info with new phone numbers
      const updatedContactInfo = await db.adminContactInfo.update({
        where: {
          id: existingContactInfo.id,
        },
        data: {
          address: data.address,
          email: data.email,
          phoneNumbers: {
            create: data.phoneNumbers.map((phone: { number: string; isDefault: boolean }) => ({
              number: phone.number,
              isDefault: phone.isDefault,
            })),
          },
        },
        include: {
          phoneNumbers: true,
        },
      });

      return NextResponse.json(updatedContactInfo);
    } catch (error) {
      console.error('Error in transaction:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error updating admin contact info:', error);
    
    // Handle Prisma errors specifically
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === 'P2001' || error.code === 'P2021') {
        return NextResponse.json(
          { error: 'Database schema error. Please run prisma generate and restart the server.' },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 