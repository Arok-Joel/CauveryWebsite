import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const plot = await prisma.plot.findUnique({
      where: {
        id: params.id,
      },
    });

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