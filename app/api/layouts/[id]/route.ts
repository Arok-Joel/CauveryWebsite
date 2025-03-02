import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const layout = await prisma.layout.findUnique({
      where: { id: params.id },
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