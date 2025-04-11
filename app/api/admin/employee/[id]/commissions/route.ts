import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { subWeeks, subMonths, subYears } from 'date-fns';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'lastMonth';
    const { id: employeeId } = await params;

    // Calculate date range based on filter
    const currentDate = new Date();
    let startDate: Date;
    let endDate: Date = currentDate;

    switch (filter) {
      case 'lastWeek':
        startDate = subWeeks(currentDate, 1);
        break;
      case 'lastMonth':
        startDate = subMonths(currentDate, 1);
        break;
      case 'lastYear':
        startDate = subYears(currentDate, 1);
        break;
      default:
        startDate = subMonths(currentDate, 1);
    }

    // Get filtered commissions
    const commissions = await db.commission.findMany({
      where: {
        employeeId,
        soldPlot: {
          soldAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
      include: {
        soldPlot: true,
      },
      orderBy: {
        soldPlot: {
          soldAt: 'desc',
        },
      },
    });

    return NextResponse.json({
      commissions: commissions.map(commission => ({
        id: commission.id,
        amount: commission.amount.toString(),
        percentage: commission.percentage.toString(),
        soldPlot: {
          plotNumber: commission.soldPlot.plotNumber,
          size: commission.soldPlot.size,
          price: commission.soldPlot.price,
          dimensions: commission.soldPlot.dimensions,
          facing: commission.soldPlot.facing,
          plotAddress: commission.soldPlot.plotAddress,
          customerName: commission.soldPlot.customerName,
          phoneNumber: commission.soldPlot.phoneNumber,
          email: commission.soldPlot.email,
          address: commission.soldPlot.address,
          aadhaarNumber: commission.soldPlot.aadhaarNumber,
          soldAt: commission.soldPlot.soldAt,
        },
      })),
    });
  } catch (error) {
    console.error('Error fetching employee commissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employee commissions' },
      { status: 500 }
    );
  }
} 