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
      totalRevenueResult,
      monthlyNewUsersResult,
      monthlySalesResult,
      monthlyRevenueResult
    ] = await Promise.all([
      // Overall metrics
      db.user.count({
        where: { role: 'USER' }
      }).catch(() => 0),
      
      db.soldPlot.count().catch(() => 0),
      
      db.soldPlot.aggregate({
        _sum: {
          price: true
        }
      }).catch(() => ({ _sum: { price: 0 } })),
      
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
      
      db.soldPlot.aggregate({
        _sum: {
          price: true
        },
        where: {
          soldAt: {
            gte: monthStart,
            lte: monthEnd
          }
        }
      }).catch(() => ({ _sum: { price: 0 } }))
    ]);

    // Extract values
    const totalUsers = totalUsersResult;
    const totalSales = totalSalesResult;
    const totalRevenue = Number(totalRevenueResult._sum.price) || 0;
    const monthlyNewUsers = monthlyNewUsersResult;
    const monthlySales = monthlySalesResult;
    const monthlyRevenue = Number(monthlyRevenueResult._sum.price) || 0;

    // Calculate conversion rates as absolute numbers (not percentages)
    // If 2 out of 10 users bought plots, the rate is 2
    const overallConversionRate = totalSales;
    const monthlyConversionRate = monthlySales;

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