import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get the team to check its current members
    const team = await db.team.findUnique({
      where: { id: params.id },
      include: {
        members: {
          select: { id: true }
        }
      }
    })

    if (!team) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      )
    }

    // Get all employees who are not part of any team and not executive directors
    const availableEmployees = await db.employee.findMany({
      where: {
        AND: [
          { teamId: null },
          { employeeRole: { not: "EXECUTIVE_DIRECTOR" } },
          { id: { notIn: team.members.map(m => m.id) } }
        ]
      },
      include: {
        user: {
          select: {
            name: true
          }
        }
      }
    })

    return NextResponse.json({
      employees: availableEmployees.map(employee => ({
        id: employee.id,
        name: employee.user.name,
        role: employee.employeeRole.replace(/_/g, " ")
      }))
    })
  } catch (error) {
    console.error("Error fetching available employees:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 