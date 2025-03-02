import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const layouts = await prisma.layout.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        Plot: true,
        _count: {
          select: {
            Plot: true
          }
        }
      },
    });

    return NextResponse.json(layouts);
  } catch (error) {
    console.error("Error fetching layouts:", error);
    return NextResponse.json(
      { error: "Failed to fetch layouts" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { name, image, plotIds } = await request.json();
    const now = new Date();
    const layoutId = Math.random().toString(36).substring(2, 9);

    // Create the layout
    const layout = await prisma.layout.create({
      data: {
        id: layoutId,
        name: name || `Layout ${now.toISOString()}`,
        image: image,
        updatedAt: now,
      },
    });

    // Connect existing plots to this layout
    if (plotIds && plotIds.length > 0) {
      await Promise.all(
        plotIds.map(async (plotId: string) => {
          return prisma.plot.update({
            where: { id: plotId },
            data: { layoutId: layout.id },
          });
        })
      );
    }

    // Fetch the complete layout with plots
    const completeLayout = await prisma.layout.findUnique({
      where: { id: layout.id },
      include: { Plot: true },
    });

    return NextResponse.json(completeLayout);
  } catch (error) {
    console.error("Error creating layout:", error);
    return NextResponse.json(
      { error: "Failed to create layout" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Layout ID is required" },
        { status: 400 }
      );
    }

    // Delete all plots associated with this layout first
    await prisma.plot.deleteMany({
      where: { layoutId: id },
    });

    // Then delete the layout
    await prisma.layout.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting layout:", error);
    return NextResponse.json(
      { error: "Failed to delete layout" },
      { status: 500 }
    );
  }
} 