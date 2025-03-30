import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { cookies } from 'next/headers';
import * as z from 'zod';

// Only enable this in development environment
const isDevelopment = process.env.NODE_ENV === 'development';

// Validate the request
const testAddCommissionsSchema = z.object({
  count: z.number().int().min(1).max(1000),
});

export async function POST(req: Request) {
  // Only allow this in development
  if (!isDevelopment) {
    return NextResponse.json(
      { error: 'This endpoint is only available in development mode' },
      { status: 403 }
    );
  }

  try {
    // Verify authentication
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No token' },
        { status: 401 }
      );
    }
    
    const verified = await verifyAuth(token);
    
    if (!verified || verified.role !== 'EMPLOYEE') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get the email from token
    const email = verified.email;
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email not found in token' },
        { status: 400 }
      );
    }

    // Get employee details using email
    const user = await db.user.findUnique({
      where: { email },
      include: { employee: true }
    });

    if (!user || !user.employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { count } = testAddCommissionsSchema.parse(body);

    // Create dummy commissions for testing
    const dummyCommissions = [];
    for (let i = 0; i < count; i++) {
      // Create a dummy SoldPlot first
      const soldPlot = await db.soldPlot.create({
        data: {
          plotNumber: `TEST-${Date.now()}-${i}`,
          size: "1000 sqft",
          plotAddress: "Test Address",
          price: "1000000",
          dimensions: "50x20",
          facing: "East",
          employeeName: user.employee.id,
          customerName: "Test Customer",
          phoneNumber: "1234567890",
          email: "test@example.com",
          address: "Test Address",
          aadhaarNumber: "123456789012",
          plot: {
            create: {
              id: `TEST-${Date.now()}-${i}`,
              plotNumber: `TEST-${Date.now()}-${i}`,
              size: "1000 sqft",
              plotAddress: "Test Address",
              price: 1000000,
              dimensions: "50x20",
              facing: "East",
              status: "sold",
              coordinates: JSON.parse('{"points":[{"x":0,"y":0},{"x":50,"y":0},{"x":50,"y":20},{"x":0,"y":20}]}'),
              images: "",
              updatedAt: new Date(),
            }
          }
        },
      });

      // Create commission for the employee
      const commission = await db.commission.create({
        data: {
          amount: 10000,
          percentage: 10,
          employeeId: user.employee.id,
          employeeRole: user.employee.employeeRole,
          soldPlotId: soldPlot.id,
        },
      });
      
      dummyCommissions.push(commission);
    }

    return NextResponse.json({
      message: `Successfully added ${count} test commissions`,
      count: dummyCommissions.length,
    });
    
  } catch (error) {
    console.error('Error adding test commissions:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to add test commissions' },
      { status: 500 }
    );
  }
} 