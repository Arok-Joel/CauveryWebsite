import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { name, phone, email, preferredLanguage, preferredTime, message, plotId } = data;

    // Validate required fields
    if (!name || !phone) {
      return NextResponse.json(
        { error: "Name and phone number are required" },
        { status: 400 }
      );
    }

    // Create the inquiry
    const inquiry = await prisma.customerInquiry.create({
      data: {
        name,
        phone,
        email,
        preferredLanguage,
        preferredTime,
        message,
        plotId,
      },
    });

    // Get all field officers
    const fieldOfficers = await prisma.employee.findMany({
      where: {
        employeeRole: "FIELD_OFFICER",
      },
    });

    // Create initial status entries for all field officers
    await Promise.all(
      fieldOfficers.map((officer) =>
        prisma.inquiryStatus.create({
          data: {
            status: "Pending",
            fieldOfficerId: officer.id,
            inquiryId: inquiry.id,
          },
        })
      )
    );

    return NextResponse.json(inquiry);
  } catch (error) {
    console.error("Error creating inquiry:", error);
    return NextResponse.json(
      { error: "Failed to create inquiry" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fieldOfficerId = searchParams.get("fieldOfficerId");

    if (!fieldOfficerId) {
      return NextResponse.json(
        { error: "Field officer ID is required" },
        { status: 400 }
      );
    }

    // Get all inquiries for this field officer
    const inquiries = await prisma.inquiryStatus.findMany({
      where: {
        fieldOfficerId,
      },
      include: {
        inquiry: {
          include: {
            plot: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(inquiries);
  } catch (error) {
    console.error("Error fetching inquiries:", error);
    return NextResponse.json(
      { error: "Failed to fetch inquiries" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { inquiryStatusId, status, notes } = data;

    if (!inquiryStatusId || !status) {
      return NextResponse.json(
        { error: "Inquiry status ID and new status are required" },
        { status: 400 }
      );
    }

    const updatedStatus = await prisma.inquiryStatus.update({
      where: {
        id: inquiryStatusId,
      },
      data: {
        status,
        notes,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(updatedStatus);
  } catch (error) {
    console.error("Error updating inquiry status:", error);
    return NextResponse.json(
      { error: "Failed to update inquiry status" },
      { status: 500 }
    );
  }
} 