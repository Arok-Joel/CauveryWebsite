import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { unstable_cache } from 'next/cache';

// Cache the plot data for 1 hour (3600 seconds)
const getCachedPlot = unstable_cache(
  async (id: string) => {
    const plot = await prisma.plot.findUnique({
      where: { id },
      include: {
        Layout: {
          select: {
            name: true,
          },
        },
      },
    });

    return plot;
  },
  ['plot-detail'],
  { revalidate: 3600 }
);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Await params if it's a promise
    const resolvedParams = 'then' in params ? await params : params;
    const id = resolvedParams.id;
    
    const plot = await getCachedPlot(id);

    if (!plot) {
      return NextResponse.json(
        { error: "Plot not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(plot);
  } catch (error) {
    console.error("Error fetching plot:", error);
    return NextResponse.json(
      { error: "Failed to fetch plot" },
      { status: 500 }
    );
  }
} 