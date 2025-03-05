import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import * as z from 'zod';

const updateTeamLeaderSchema = z.object({
  leaderId: z.string().min(1),
});

export async function PATCH(
  req: Request,
  context: { params: { teamId: string } }
) {
  try {
    const { teamId } = context.params;
    const body = await req.json();
    const { leaderId } = updateTeamLeaderSchema.parse(body);

    // Verify that the new leader is an Executive Director
    const newLeader = await db.employee.findUnique({
      where: { id: leaderId },
      include: {
        leadsTeam: true,
        memberOfTeam: true,
      },
    });

    if (!newLeader) {
      return NextResponse.json({ error: 'New leader not found' }, { status: 404 });
    }

    if (newLeader.employeeRole !== 'EXECUTIVE_DIRECTOR') {
      return NextResponse.json(
        { error: 'Team leader must be an Executive Director' },
        { status: 400 }
      );
    }

    if (newLeader.leadsTeam || newLeader.memberOfTeam) {
      return NextResponse.json(
        { error: 'This Executive Director is already part of a team' },
        { status: 400 }
      );
    }

    // Get current team and leader
    const currentTeam = await db.team.findUnique({
      where: { id: teamId },
      include: {
        leader: true,
        members: true,
      },
    });

    if (!currentTeam) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Update the team with the new leader
    const updatedTeam = await db.team.update({
      where: { id: teamId },
      data: {
        leaderId: leaderId, // Directly update the leaderId
      },
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

    console.error('Error updating team leader:', error);
    return NextResponse.json({ error: 'Failed to update team leader' }, { status: 500 });
  }
}
