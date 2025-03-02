import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const {
      plotId,
      plotNumber,
      size,
      plotAddress,
      price,
      dimensions,
      facing,
      employeeName,
      customerName,
      phoneNumber,
      email,
      address,
      aadhaarNumber,
    } = data;

    // Validate that all required fields are present
    if (!plotId || !plotNumber || !size || !plotAddress || !price || !dimensions || 
        !facing || !employeeName || !customerName || !phoneNumber || !email || 
        !address || !aadhaarNumber) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Check if plot exists and is available before starting transaction
    const existingPlot = await prisma.plot.findUnique({
      where: { id: plotId },
    });

    if (!existingPlot) {
      return NextResponse.json(
        { error: "Plot not found" },
        { status: 404 }
      );
    }

    if (existingPlot.status.toLowerCase() !== "available") {
      return NextResponse.json(
        { error: "Plot is not available for booking" },
        { status: 400 }
      );
    }

    // Start a transaction to ensure both operations succeed or fail together
    const result = await prisma.$transaction(async (tx) => {
      // Create the sold plot record
      const soldPlot = await prisma.soldPlot.create({
        data: {
          plotNumber,
          size,
          plotAddress,
          price,
          dimensions,
          facing,
          employeeName,
          customerName,
          phoneNumber,
          email,
          address,
          aadhaarNumber,
          plotId,
        },
      });

      // Update the plot status to "sold"
      const updatedPlot = await prisma.plot.update({
        where: { id: plotId },
        data: { status: "sold" },
      });

      return { soldPlot, updatedPlot };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error booking plot:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to book plot" },
      { status: 500 }
    );
  }
} 