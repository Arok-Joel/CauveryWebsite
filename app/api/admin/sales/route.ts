import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { 
  startOfYear, endOfYear, subYears,
  startOfQuarter, endOfQuarter,
  format, parse, 
} from 'date-fns';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeFilter = searchParams.get('timeFilter') || 'months';

    // Calculate date range based on filter
    const currentDate = new Date();
    let startDate: Date;
    let endDate: Date = currentDate;
    let groupingFunction: (date: Date) => string;

    switch (timeFilter) {
      case 'months':
        startDate = startOfYear(currentDate);
        groupingFunction = (date: Date) => format(date, 'MMM yyyy');
        break;
      case 'quarters':
        startDate = startOfYear(currentDate);
        groupingFunction = (date: Date) => `Q${Math.floor(date.getMonth() / 3) + 1}`;
        break;
      case 'years':
        startDate = startOfYear(subYears(currentDate, 4)); // Last 5 years
        groupingFunction = (date: Date) => format(date, 'yyyy');
        break;
      default:
        startDate = startOfYear(currentDate);
        groupingFunction = (date: Date) => format(date, 'MMM yyyy');
    }

    // Get all sold plots with detailed information
    const soldPlots = await db.soldPlot.findMany({
      where: {
        soldAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        plotNumber: true,
        customerName: true,
        price: true,
        soldAt: true,
        size: true,
        dimensions: true,
        facing: true,
        plotAddress: true,
        phoneNumber: true,
        email: true,
        address: true,
        aadhaarNumber: true,
        employeeName: true,
        commissions: {
          select: {
            employeeRole: true
          },
          take: 1
        }
      },
      orderBy: {
        soldAt: 'desc',
      },
    });

    // Calculate total sales and revenue
    const totalSales = soldPlots.length;
    const totalRevenue = soldPlots.reduce((sum, plot) => sum + parseFloat(plot.price), 0);

    // Group data based on the selected time filter
    const groupedData = soldPlots.reduce((acc, plot) => {
      const label = groupingFunction(new Date(plot.soldAt));
      const existingGroup = acc.find(item => item.label === label);
      
      if (existingGroup) {
        existingGroup.count++;
        existingGroup.revenue += parseFloat(plot.price);
      } else {
        acc.push({
          label,
          count: 1,
          revenue: parseFloat(plot.price),
        });
      }
      return acc;
    }, [] as { label: string; count: number; revenue: number }[]);

    // Fill in missing periods with zero values
    let filledData: typeof groupedData = [];
    
    if (timeFilter === 'months') {
      const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];
      const year = currentDate.getFullYear();
      
      filledData = months.map(month => {
        const label = `${month} ${year}`;
        const existing = groupedData.find(item => item.label === label);
        return existing || { label, count: 0, revenue: 0 };
      });
    } else if (timeFilter === 'quarters') {
      filledData = ['Q1', 'Q2', 'Q3', 'Q4'].map(quarter => {
        const existing = groupedData.find(item => item.label === quarter);
        return existing || { label: quarter, count: 0, revenue: 0 };
      });
    } else if (timeFilter === 'years') {
      const currentYear = currentDate.getFullYear();
      filledData = Array.from({ length: 5 }, (_, i) => {
        const year = (currentYear - 4 + i).toString();
        const existing = groupedData.find(item => item.label === year);
        return existing || { label: year, count: 0, revenue: 0 };
      });
    }

    return NextResponse.json({
      totalSales,
      totalRevenue,
      data: filledData,
      soldPlots: soldPlots.map(plot => ({
        ...plot,
        price: plot.price.toString(),
        soldAt: plot.soldAt.toISOString(),
        employeeRole: plot.commissions[0]?.employeeRole
      })),
    });
  } catch (error) {
    console.error('Error in sales data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales data' },
      { status: 500 }
    );
  }
} 