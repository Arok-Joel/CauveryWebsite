import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/layouts
export async function GET() {
  try {
    const layouts = await db.layout.findMany({
      include: {
        plots: true,
      },
    });
    
    return NextResponse.json(layouts);
  } catch (error) {
    console.error('Error fetching layouts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch layouts' },
      { status: 500 }
    );
  }
}

// POST /api/layouts
export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    const layout = await db.layout.create({
      data: {
        name: data.name,
        image: data.image,
        plots: {
          create: data.plotAreas.map((plot: any) => ({
            plotNumber: plot.plotNumber,
            coordinates: plot.coordinates,
            siteName: plot.details?.siteName || '',
            size: plot.details?.size || '',
            plotAddress: plot.details?.plotAddress || '',
            price: plot.details?.price || 0,
            dimensions: plot.details?.dimensions || '',
            facing: plot.details?.facing || '',
            status: plot.details?.status || 'Available',
          })),
        },
      },
      include: {
        plots: true,
      },
    });
    
    return NextResponse.json(layout);
  } catch (error) {
    console.error('Error creating layout:', error);
    return NextResponse.json(
      { error: 'Failed to create layout' },
      { status: 500 }
    );
  }
} 