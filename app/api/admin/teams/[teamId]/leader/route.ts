import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as z from 'zod';

const updateLeaderSchema = z.object({
  leaderId: z.string().min(1),
});

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ teamId: string }> }
) {
  try {
    const params = await context.params;
    const body = await req.json();
    const { leaderId } = updateLeaderSchema.parse(body);

    // Verify the team exists
    const team = await db.team.findUnique({
      where: { id: params.teamId },
      include: {
        leader: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Verify the new leader exists and is an Executive Director
    const newLeader = await db.employee.findUnique({
      where: { id: leaderId },
      include: {
        user: true,
        leadsTeam: true,
      },
    });

    if (!newLeader) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    if (newLeader.employeeRole !== 'EXECUTIVE_DIRECTOR') {
      return NextResponse.json(
        { error: 'Only Executive Directors can lead teams' },
        { status: 400 }
      );
    }

    if (newLeader.leadsTeam && newLeader.leadsTeam.id !== params.teamId) {
      return NextResponse.json(
        { error: 'This Executive Director already leads another team' },
        { status: 400 }
      );
    }

    // Update the team with the new leader
    const updatedTeam = await db.team.update({
      where: { id: params.teamId },
      data: { leaderId },
      include: {
        leader: {
          include: {
            user: true,
          },
        },
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    return NextResponse.json(updatedTeam);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
