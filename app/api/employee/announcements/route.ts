import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    // Get auth token from cookies in headers
    const cookieHeader = req.headers.get("cookie")
    const token = cookieHeader?.split(";")
      .find((c: string) => c.trim().startsWith("auth-token="))
      ?.split("=")[1]

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Verify token
    const verified = await verifyAuth(token)
    if (!verified || verified.role !== "EMPLOYEE") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get active announcements
    const announcements = await db.announcement.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        admin: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({ announcements })
  } catch (error) {
    console.error("Announcements fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 