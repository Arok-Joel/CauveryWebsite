import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { startOfMonth, endOfMonth } from 'date-fns';

export async function GET() {
  // Define a default response
  const defaultResponse = {
    overall: {
      totalUsers: 0,
      totalSales: 0,
      conversionRate: 0,
      totalRevenue: 0
    },
    monthly: {
      newUsers: 0,
      sales: 0,
      conversionRate: 0,
      revenue: 0
    }
  };

  try {
    // Get date ranges
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    // Connect to database
    await db.$connect();
    
    // Run all queries in parallel for better performance
    const [
      totalUsersResult, 
      totalSalesResult,
      monthlyNewUsersResult,
      monthlySalesResult
    ] = await Promise.all([
      // Overall metrics
      db.user.count({
        where: { role: 'USER' }
      }).catch(() => 0),
      
      db.soldPlot.count().catch(() => 0),
      
      // Monthly metrics
      db.user.count({
        where: {
          role: 'USER',
          createdAt: {
            gte: monthStart,
            lte: monthEnd
          }
        }
      }).catch(() => 0),
      
      db.soldPlot.count({
        where: {
          soldAt: {
            gte: monthStart,
            lte: monthEnd
          }
        }
      }).catch(() => 0),
    ]);

    // Get all sold plots for revenue calculations
    const allSoldPlots = await db.soldPlot.findMany({
      select: {
        price: true,
        soldAt: true,
      }
    }).catch(() => []);

    // Calculate total revenue by converting string prices to numbers
    const totalRevenue = allSoldPlots.reduce((sum, plot) => {
      return sum + (parseFloat(plot.price) || 0);
    }, 0);

    // Calculate monthly revenue
    const monthlyRevenue = allSoldPlots.reduce((sum, plot) => {
      const soldDate = new Date(plot.soldAt);
      if (soldDate >= monthStart && soldDate <= monthEnd) {
        return sum + (parseFloat(plot.price) || 0);
      }
      return sum;
    }, 0);

    // Extract values
    const totalUsers = totalUsersResult;
    const totalSales = totalSalesResult;
    const monthlyNewUsers = monthlyNewUsersResult;
    const monthlySales = monthlySalesResult;

    // Calculate conversion rates as percentages (capped at 100%)
    const overallConversionRate = totalUsers > 0 
      ? Math.min(((totalSales / totalUsers) * 100), 100).toFixed(1)
      : '0';

    const monthlyConversionRate = monthlyNewUsers > 0
      ? Math.min(((monthlySales / monthlyNewUsers) * 100), 100).toFixed(1)
      : '0';

    // Build response
    const response = {
      overall: {
        totalUsers,
        totalSales,
        conversionRate: overallConversionRate,
        totalRevenue
      },
      monthly: {
        newUsers: monthlyNewUsers,
        sales: monthlySales,
        conversionRate: monthlyConversionRate,
        revenue: monthlyRevenue
      }
    };

    // Log for debugging
    console.log('Dashboard metrics response:', JSON.stringify(response));
    
    // Return successful response
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in dashboard metrics:', error);
    
    // Return error response with default data
    return NextResponse.json({
      ...defaultResponse,
      error: 'Failed to fetch dashboard metrics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    // Always disconnect from the database
    try {
      await db.$disconnect();
    } catch (e) {
      console.error('Error disconnecting from database:', e);
    }
  }
} 