import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(
  req: Request,
  { params }: { params: { teamId: string } }
) {
  try {
    const { teamId } = params

    const team = await db.team.findUnique({
      where: {
        id: teamId,
      },
      include: {
        leader: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        members: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    if (!team) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(team)
  } catch (error) {
    console.error("Error fetching team:", error)
    return NextResponse.json(
      { error: "Failed to fetch team" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { teamId: string } }
) {
  try {
    const { teamId } = params

    // Delete the team
    await db.team.delete({
      where: {
        id: teamId,
      },
    })

    return NextResponse.json({ message: "Team deleted successfully" })
  } catch (error) {
    console.error("Error deleting team:", error)
    return NextResponse.json(
      { error: "Failed to delete team" },
      { status: 500 }
    )
  }
}
