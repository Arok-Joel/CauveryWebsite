import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    // Verify admin authentication
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No token' },
        { status: 401 }
      );
    }
    
    const verified = await verifyAuth(token);
    
    if (!verified || verified.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    // Get all promotion requests with employee details
    const promotionRequests = await db.promotionRequest.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        reviewedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Get employee details for each request
    const requestsWithEmployeeDetails = await Promise.all(
      promotionRequests.map(async (request) => {
        const employee = await db.employee.findUnique({
          where: { id: request.employeeId },
          include: {
            user: {
              select: {
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        });

        return {
          ...request,
          employee,
        };
      })
    );

    return NextResponse.json({
      promotionRequests: requestsWithEmployeeDetails,
    });
    
  } catch (error) {
    console.error('Error fetching promotion requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch promotion requests' },
      { status: 500 }
    );
  }
} 