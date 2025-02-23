import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"
import * as z from "zod"
import { createUserSession } from "@/lib/auth"

const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  address: z.string().optional(),
  pincode: z.string().optional(),
})

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
    if (!verified || verified.role !== "USER") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get user data
    const user = await db.user.findUnique({
      where: { email: verified.email },
      select: {
        name: true,
        email: true,
        phone: true,
        address: true,
        pincode: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Profile fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(req: Request) {
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
    if (!verified || verified.role !== "USER") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const validatedData = updateProfileSchema.parse(body)

    // Update user data
    const updatedUser = await db.user.update({
      where: { email: verified.email },
      data: validatedData,
      select: {
        name: true,
        email: true,
        phone: true,
        address: true,
        pincode: true,
        createdAt: true,
      },
    })

    // Create new session with updated name
    const { response } = await createUserSession({
      email: verified.email,
      name: updatedUser.name,
      role: verified.role,
    })

    // Copy the user data from the original response
    const finalResponse = NextResponse.json({ user: updatedUser })
    
    // Copy the new auth token cookie from the session response
    finalResponse.cookies.set(
      "auth-token",
      response.cookies.get("auth-token")?.value || "",
      response.cookies.get("auth-token")?.options
    )

    return finalResponse
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }

    console.error("Profile update error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 