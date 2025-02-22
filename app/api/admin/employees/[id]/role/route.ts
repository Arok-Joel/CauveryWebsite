import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import * as z from "zod"

const roleUpdateSchema = z.object({
  role: z.enum(["EXECUTIVE_DIRECTOR", "DIRECTOR", "JOINT_DIRECTOR", "FIELD_OFFICER"]),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<Response> {
  try {
    const body = await req.json()
    const { role } = roleUpdateSchema.parse(body)

    const updatedEmployee = await db.employee.update({
      where: { id: params.id },
      data: { employeeRole: role },
    })

    return NextResponse.json(updatedEmployee)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }

    // Log the error for debugging
    console.error('Error updating employee role:', error)

    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to update employee role: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: "An unexpected error occurred while updating employee role" },
      { status: 500 }
    )
  }
}
