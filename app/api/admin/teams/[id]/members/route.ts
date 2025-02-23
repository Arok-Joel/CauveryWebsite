import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import * as z from "zod"

const addMemberSchema = z.object({
  employeeId: z.string().min(1),
})

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const { employeeId } = addMemberSchema.parse(body)

    // Check if team exists
    const team = await db.team.findUnique({
      where: { id: params.id },
      include: {
        members: true
      }
    })

    if (!team) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      )
    }

    // Check if employee exists and is not already in a team
    const employee = await db.employee.findUnique({
      where: { id: employeeId },
      include: {
        memberOfTeam: true
      }
    })

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      )
    }

    if (employee.memberOfTeam) {
      return NextResponse.json(
        { error: "Employee is already part of a team" },
        { status: 400 }
      )
    }

    // Add employee to team
    const updatedTeam = await db.team.update({
      where: { id: params.id },
      data: {
        members: {
          connect: { id: employeeId }
        }
      },
      include: {
        members: {
          include: {
            user: true
          }
        }
      }
    })

    return NextResponse.json(updatedTeam)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }

    console.error("Error adding team member:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 