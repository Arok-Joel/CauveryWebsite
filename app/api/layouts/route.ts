import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const CHUNK_SIZE = 10; // Process plots in chunks to avoid overwhelming the database

export async function GET(req: Request) {
  const start = Date.now();
  console.log("Starting layouts request...");
  
  // Set maximum execution time to 30 seconds
  const MAX_EXECUTION_TIME = 30000;
  let timedOut = false;
  
  const timeoutId = setTimeout(() => {
    timedOut = true;
    console.log("Request timed out after 30 seconds");
  }, MAX_EXECUTION_TIME);
  
  try {
    // Extract query parameters
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const withPlots = searchParams.get("withPlots") === "true";

    const skip = (page - 1) * limit;

    // First, fetch just layout IDs and counts - this is much faster
    console.time("Initial layouts query");
    const layoutIdsQuery = await prisma.layout.findMany({
      select: {
        id: true,
        _count: {
          select: {
            Plot: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
      skip,
      take: limit,
    });
    console.timeEnd("Initial layouts query");
    
    if (timedOut) {
      throw new Error("Request timed out");
    }

    // Extract layout IDs
    const layoutIds = layoutIdsQuery.map(layout => layout.id);
    console.log(`Processing ${layoutIds.length} layouts`);

    // Execute these queries in parallel for better performance
    console.time("Parallel queries");
    const [layoutDetails, totalLayoutsCount] = await Promise.all([
      // Get full layout details for the IDs we've identified
      prisma.layout.findMany({
        where: {
          id: {
            in: layoutIds,
          },
        },
        include: {
          _count: {
            select: {
              Plot: true,
            },
          },
        },
        orderBy: {
          name: "asc",
        },
      }),
      
      // Get total count for pagination
      prisma.layout.count(),
    ]);
    console.timeEnd("Parallel queries");
    
    if (timedOut) {
      throw new Error("Request timed out");
    }

    // Create a map for plot counts
    const plotCountsMap = layoutIdsQuery.reduce((acc, layout) => {
      acc[layout.id] = layout._count.Plot;
      return acc;
    }, {} as Record<string, number>);

    // Map our layout details maintaining original order
    const layouts = layoutDetails.sort((a, b) => 
      layoutIds.indexOf(a.id) - layoutIds.indexOf(b.id)
    ).map(layout => ({
      ...layout,
      _count: {
        Plot: plotCountsMap[layout.id],
      },
      Plot: [] as any[],
    }));

    if (withPlots) {
      console.log("Fetching plots for layouts...");
      
      // Process plots in chunks to avoid overwhelming the database
      const processLayoutChunks = async () => {
        console.time("Processing plot chunks");
        
        // Process layouts in batches
        for (let i = 0; i < layouts.length; i += CHUNK_SIZE) {
          if (timedOut) {
            throw new Error("Request timed out while processing plots");
          }
          
          const layoutChunk = layouts.slice(i, i + CHUNK_SIZE);
          const chunkIds = layoutChunk.map(layout => layout.id);
          
          console.log(`Processing plots for layouts ${i + 1} to ${Math.min(i + CHUNK_SIZE, layouts.length)}`);
          
          // Fetch plots for this chunk of layouts
          const plotsForChunk = await prisma.plot.findMany({
            where: {
              layoutId: {
                in: chunkIds,
              },
            },
          });
          
          // Group plots by layout ID
          const plotsByLayout = plotsForChunk.reduce((acc, plot) => {
            if (!acc[plot.layoutId!]) {
              acc[plot.layoutId!] = [];
            }
            acc[plot.layoutId!].push(plot);
            return acc;
          }, {} as Record<string, any[]>);
          
          // Assign plots to their layouts
          for (const layout of layoutChunk) {
            layout.Plot = plotsByLayout[layout.id] || [];
          }
          
          // Add a small delay to prevent overloading the database
          if (i + CHUNK_SIZE < layouts.length) {
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        }
        
        console.timeEnd("Processing plot chunks");
      };

      await processLayoutChunks();
    }

    const pagination = {
      page,
      limit,
      totalPages: Math.ceil(totalLayoutsCount / limit),
      totalItems: totalLayoutsCount,
    };

    clearTimeout(timeoutId);
    const end = Date.now();
    console.log(`Total layouts request time: ${end - start}ms`);

    return NextResponse.json({
      data: layouts,
      pagination,
    });
  } catch (error) {
    clearTimeout(timeoutId);
    console.error("Error in layouts API:", error);
    
    const end = Date.now();
    console.log(`Failed layouts request time: ${end - start}ms`);
    
    if (timedOut) {
      return NextResponse.json(
        { error: "Request timed out. The operation took too long to complete." },
        { status: 504 }
      );
    }
    
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