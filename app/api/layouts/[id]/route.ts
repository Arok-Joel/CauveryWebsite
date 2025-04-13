import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    // Extract the layout ID from context.params
    const layoutId = context.params.id;
    
    const layout = await prisma.layout.findUnique({
      where: { id: layoutId },
      include: {
        Plot: true,
      },
    });

    if (!layout) {
      return NextResponse.json(
        { error: "Layout not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(layout);
  } catch (error) {
    console.error("Error fetching layout:", error);
    return NextResponse.json(
      { error: "Failed to fetch layout" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;
    const { name, image, plots } = await request.json();

    // First, update the layout details
    const updatedLayout = await prisma.layout.update({
      where: { id },
      data: {
        name,
        image,
      },
    });

    // For each plot, either update existing or create new
    for (const plot of plots) {
      if (plot.id) {
        // Update existing plot - preserve the exact coordinates
        await prisma.plot.update({
          where: { id: plot.id },
          data: {
            plotNumber: plot.plotNumber,
            size: plot.size,
            plotAddress: plot.plotAddress,
            price: parseFloat(plot.price) || 0,
            dimensions: plot.dimensions,
            facing: plot.facing,
            status: plot.status,
            // Store the exact coordinates without any transformations
            coordinates: plot.points,
            // Store images as JSON string
            images: plot.images ? JSON.stringify(plot.images) : "[]",
          },
        });
      } else {
        // Create new plot with exact coordinates
        const newPlot = await prisma.plot.create({
          data: {
            id: crypto.randomUUID(),
            plotNumber: plot.plotNumber,
            size: plot.size,
            plotAddress: plot.plotAddress,
            price: parseFloat(plot.price) || 0,
            dimensions: plot.dimensions,
            facing: plot.facing,
            status: plot.status,
            // Store the exact coordinates
            coordinates: plot.points,
            layoutId: id,
            // Store images as JSON string
            images: plot.images ? JSON.stringify(plot.images) : "[]", 
            updatedAt: new Date(),
          },
        });
      }
    }

    // Return the updated layout with plots
    const layout = await prisma.layout.findUnique({
      where: { id },
      include: {
        Plot: true
      },
    });

    return NextResponse.json(layout);
  } catch (error) {
    console.error("Error updating layout:", error);
    return NextResponse.json(
      { error: "Failed to update layout", details: (error as Error).message },
      { status: 500 }
    );
  }
} 