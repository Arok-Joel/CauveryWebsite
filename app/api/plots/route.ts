import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { writeFile } from "fs/promises";
import { join } from "path";
import { mkdir } from "fs/promises";
import { v4 as uuidv4 } from 'uuid';

// GET all plots
export async function GET() {
  try {
    const plots = await prisma.plot.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(plots);
  } catch (error) {
    console.error("Error fetching plots:", error);
    return NextResponse.json(
      { error: "Failed to fetch plots" },
      { status: 500 }
    );
  }
}

// POST - Create or update a plot
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { 
      id, 
      plotNumber, 
      size, 
      plotAddress, 
      price, 
      dimensions, 
      facing, 
      status, 
      coordinates,
      images 
    } = data;

    // Check if plot with this ID already exists
    const existingPlot = id 
      ? await prisma.plot.findUnique({ where: { id } })
      : await prisma.plot.findUnique({ where: { plotNumber } });

    let plot;
    
    if (existingPlot) {
      // Update existing plot
      plot = await prisma.plot.update({
        where: { id: existingPlot.id },
        data: {
          plotNumber,
          size,
          plotAddress,
          price: parseFloat(price),
          dimensions,
          facing,
          status,
          coordinates,
          images: JSON.stringify(images), // Store base64 images directly
          updatedAt: new Date(),
        },
      });
      
      console.log("Updated plot:", plot);
    } else {
      // Create new plot
      plot = await prisma.plot.create({
        data: {
          id: id || Math.random().toString(36).substring(2, 9),
          plotNumber,
          size,
          plotAddress,
          price: parseFloat(price),
          dimensions,
          facing,
          status: status || "available",
          coordinates,
          images: JSON.stringify(images), // Store base64 images directly
          updatedAt: new Date(),
        },
      });
      
      console.log("Created new plot:", plot);
    }

    // Parse the images back from JSON string for the response
    const parsedPlot = {
      ...plot,
      images: JSON.parse(plot.images || '[]')
    };

    return NextResponse.json(parsedPlot);
  } catch (error) {
    console.error("Error saving plot:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save plot" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a plot
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Plot ID is required" },
        { status: 400 }
      );
    }

    await prisma.plot.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting plot:", error);
    return NextResponse.json(
      { error: "Failed to delete plot" },
      { status: 500 }
    );
  }
} 