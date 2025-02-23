import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import * as z from "zod"

const createTeamSchema = z.object({
  leaderId: z.string().min(1),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { leaderId } = createTeamSchema.parse(body)

    // Verify that the leader is an Executive Director
    const leader = await db.employee.findUnique({
      where: { id: leaderId },
      include: {
        leadsTeam: {
          select: {
            id: true,
          }
        },
        memberOfTeam: {
          select: {
            id: true,
          }
        }
      }
    })

    if (!leader) {
      return NextResponse.json(
        { error: "Leader not found" },
        { status: 404 }
      )
    }

    if (leader.employeeRole !== "EXECUTIVE_DIRECTOR") {
      return NextResponse.json(
        { error: "Team leader must be an Executive Director" },
        { status: 400 }
      )
    }

    if (leader.leadsTeam || leader.memberOfTeam) {
      return NextResponse.json(
        { error: "This Executive Director is already part of a team" },
        { status: 400 }
      )
    }

    // Create the team
    const team = await db.team.create({
      data: {
        leader: {
          connect: { id: leaderId }
        }
      },
      include: {
        leader: {
          include: {
            user: true
          }
        }
      }
    })

    return NextResponse.json(team)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }

    console.error("Team creation error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}