import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { startOfYear, subYears, format } from "date-fns";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "monthly";

    let salesData;
    let chartData;

    switch (filter) {
      case "monthly": {
        // Get current year's monthly data
        salesData = await prisma.soldPlot.groupBy({
          by: ["soldAt"],
          _sum: {
            price: true,
          },
          _count: true,
          where: {
            soldAt: {
              gte: startOfYear(new Date()),
            },
          },
        });

        chartData = Array.from({ length: 12 }, (_, i) => ({
          name: format(new Date(2024, i), "MMM"),
          revenue: 0,
        }));

        salesData.forEach((sale) => {
          const month = new Date(sale.soldAt).getMonth();
          chartData[month].revenue = Number(sale._sum.price) || 0;
        });
        break;
      }

      case "quarterly": {
        // Get quarterly data for current year
        salesData = await prisma.soldPlot.groupBy({
          by: ["soldAt"],
          _sum: {
            price: true,
          },
          _count: true,
          where: {
            soldAt: {
              gte: startOfYear(new Date()),
            },
          },
        });

        chartData = [
          { name: "Q1", revenue: 0 },
          { name: "Q2", revenue: 0 },
          { name: "Q3", revenue: 0 },
          { name: "Q4", revenue: 0 },
        ];

        salesData.forEach((sale) => {
          const month = new Date(sale.soldAt).getMonth();
          const quarter = Math.floor(month / 3);
          chartData[quarter].revenue += Number(sale._sum.price) || 0;
        });
        break;
      }

      case "yearly": {
        // Get last 5 years data
        salesData = await prisma.soldPlot.groupBy({
          by: ["soldAt"],
          _sum: {
            price: true,
          },
          _count: true,
          where: {
            soldAt: {
              gte: subYears(new Date(), 5),
            },
          },
        });

        chartData = Array.from({ length: 5 }, (_, i) => ({
          name: String(new Date().getFullYear() - (4 - i)),
          revenue: 0,
        }));

        salesData.forEach((sale) => {
          const year = new Date(sale.soldAt).getFullYear();
          const index = chartData.findIndex((item) => item.name === String(year));
          if (index !== -1) {
            chartData[index].revenue += Number(sale._sum.price) || 0;
          }
        });
        break;
      }
    }

    // Calculate metrics
    const totalSales = salesData.reduce((acc, curr) => acc + curr._count, 0);
    const totalRevenue = salesData.reduce((acc, curr) => acc + Number(curr._sum.price), 0);
    const averageRevenue = totalSales ? totalRevenue / totalSales : 0;

    // Find best performing period
    const bestPeriod = chartData.reduce((prev, curr) => 
      prev.revenue > curr.revenue ? prev : curr
    );

    return NextResponse.json({
      metrics: {
        totalSales,
        totalRevenue,
        averageRevenue,
        bestPerformingPeriod: bestPeriod.name,
      },
      chartData,
    });
  } catch (error) {
    console.error("Error fetching sales overview:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales overview" },
      { status: 500 }
    );
  }
} 