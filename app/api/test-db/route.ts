import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Get the database schema for the Plot table
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Plot'
    `;
    
    // Try to create a plot without siteName
    const testPlot = await prisma.plot.create({
      data: {
        id: Math.random().toString(36).substring(2, 9),
        plotNumber: "TEST-" + Date.now(),
        size: "100 sq ft",
        plotAddress: "Test Address",
        price: 1000,
        dimensions: "10x10",
        facing: "North",
        status: "available",
        coordinates: [],
        updatedAt: new Date(),
      },
    });
    
    // Delete the test plot
    await prisma.plot.delete({
      where: { id: testPlot.id },
    });
    
    return NextResponse.json({
      schema: result,
      testPlot,
      message: "Test successful - Plot created and deleted without siteName"
    });
  } catch (error) {
    console.error("Test failed:", error);
    return NextResponse.json(
      { 
        error: "Test failed", 
        details: error.message,
        code: error.code,
        meta: error.meta
      },
      { status: 500 }
    );
  }
} 