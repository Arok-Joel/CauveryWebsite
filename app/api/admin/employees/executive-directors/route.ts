import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const executiveDirectors = await db.employee.findMany({
      where: {
        employeeRole: "EXECUTIVE_DIRECTOR",
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    })

    return NextResponse.json({
      executiveDirectors: executiveDirectors.map((director) => ({
        id: director.id,
        name: director.user.name,
      })),
    })
  } catch (error) {
    console.error("Error fetching executive directors:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 