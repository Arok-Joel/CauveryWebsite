import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateTeamDialog } from "@/components/admin/create-team-dialog";
import { AssignTeamMemberDialog } from "@/components/admin/assign-team-member-dialog";
import { DeleteTeamDialog } from "@/components/admin/delete-team-dialog";
import { ManageTeamDialog } from "@/components/admin/manage-team-dialog";
import { ManageTeamHierarchyDialog } from "@/components/admin/manage-team-hierarchy-dialog";
import { UserCircle } from "lucide-react";

type TeamWithLeaderAndMembers = {
  id: string;
  name: string;
  leader: {
    id: string;
    employeeRole: string;
    user: {
      name: string;
      email: string;
    };
  };
  members: {
    id: string;
    employeeRole: string;
    user: {
      name: string;
      email: string;
    };
  }[];
};

async function getTeams() {
  const teams = await db.team.findMany({
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
  });
  return teams as TeamWithLeaderAndMembers[];
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function TeamsPage() {
  const teams = await getTeams();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Teams</h2>
        <CreateTeamDialog />
      </div>

      {teams.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <UserCircle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No teams</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new team.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {teams.map((team) => (
            <Card key={team.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-bold">{team.name}</CardTitle>
                <div className="flex items-center gap-2">
                  <ManageTeamHierarchyDialog
                    teamId={team.id}
                    teamName={team.name || "Team"}
                    members={team.members}
                  />
                  <ManageTeamDialog
                    teamId={team.id}
                    currentLeaderId={team.leader.id}
                  />
                  <AssignTeamMemberDialog teamId={team.id} teamName={team.name} />
                  <DeleteTeamDialog teamId={team.id} teamName={team.name} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Team Leader</h4>
                    <div className="mt-1 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{team.leader.user.name}</p>
                        <p className="text-sm text-gray-500">{team.leader.user.email}</p>
                      </div>
                      <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                        {team.leader.employeeRole.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Team Members ({team.members.length})</h4>
                    <div className="mt-2 divide-y divide-gray-100">
                      {team.members.map((member) => (
                        <div key={member.id} className="flex items-center justify-between py-2">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{member.user.name}</p>
                            <p className="text-sm text-gray-500">{member.user.email}</p>
                          </div>
                          <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                            {member.employeeRole.replace(/_/g, " ")}
                          </span>
                        </div>
                      ))}
                      {team.members.length === 0 && (
                        <p className="py-4 text-sm text-gray-500 text-center">No members yet</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 