import { getTeamsWithDetails } from '@/lib/queries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreateTeamDialog } from '@/components/admin/create-team-dialog';
import { AssignTeamMemberDialog } from '@/components/admin/assign-team-member-dialog';
import { DeleteTeamDialog } from '@/components/admin/delete-team-dialog';
import { ManageTeamDialog } from '@/components/admin/manage-team-dialog';
import { ManageTeamHierarchyDialog } from '@/components/admin/manage-team-hierarchy-dialog';
import { UserCircle, Users, Settings, UserPlus, Trash2, Network, Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type TeamWithLeaderAndMembers = {
  id: string;
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
    reportsToId: string | null;
    user: {
      name: string;
      email: string;
    };
  }[];
};

async function getTeams() {
  const teams = await getTeamsWithDetails();
  return teams;
}

// Helper function to get role-based styling
function getRoleBadgeStyles(role: string) {
  switch (role) {
    case 'EXECUTIVE_DIRECTOR':
      return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 whitespace-nowrap min-w-[140px]';
    case 'DIRECTOR':
      return 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 whitespace-nowrap min-w-[100px]';
    case 'JOINT_DIRECTOR':
      return 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200 whitespace-nowrap min-w-[120px]';
    case 'FIELD_OFFICER':
      return 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200 whitespace-nowrap min-w-[100px]';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200 whitespace-nowrap min-w-[80px]';
  }
}

// Helper function to get initials from name
function getInitials(name: string) {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase();
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TeamsPage() {
  const teams = await getTeams();

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="h-8 w-1 bg-[#3C5A3E] rounded-full"></div>
          <h3 className="text-xl font-medium text-gray-700">Manage Your Teams</h3>
        </div>
        <CreateTeamDialog />
      </div>

      {teams.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10">
          <div className="text-center max-w-md mx-auto">
            <div className="bg-gray-50 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No teams created yet</h3>
            <p className="text-gray-500 mb-6">Create your first team to start organizing your employees into efficient working groups.</p>
            <CreateTeamDialog />
          </div>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-2 xl:grid-cols-3">
          {teams.map(team => (
            <Card key={team.id} className="overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
              <div className="bg-gradient-to-r from-[#3C5A3E]/90 to-[#2A3F2B] text-white p-4 sm:p-6">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-white/50">
                      <AvatarFallback className="bg-[#2A3F2B] text-white">
                        {getInitials(team.leader.user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold line-clamp-1">{team.leader.user.name}'s Team</h3>
                      <p className="text-xs sm:text-sm text-white/80">{team.leader.user.email}</p>
                    </div>
                  </div>
                  <Badge className="bg-white/20 hover:bg-white/30 text-white border-none">
                    {team.members.length} {team.members.length === 1 ? 'Member' : 'Members'}
                  </Badge>
                </div>
              </div>
              
              <CardContent className="p-0 flex-1 flex flex-col">
                <div className="p-4 sm:p-6 space-y-3 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-[#3C5A3E]" />
                      Team Leader
                    </h4>
                    <Badge className={getRoleBadgeStyles(team.leader.employeeRole)}>
                      {team.leader.employeeRole.replace(/_/g, ' ')}
                    </Badge>
                  </div>

                  <div className="border-t border-gray-100 pt-3 flex-1">
                    <h4 className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-3">
                      <Users className="h-4 w-4 text-[#3C5A3E]" />
                      Team Members
                    </h4>
                    
                    {team.members.length === 0 ? (
                      <div className="text-center py-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500">No members assigned yet</p>
                        <p className="text-xs text-gray-400 mt-1">Use the "Add Members" button to assign team members</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {team.members.map(member => (
                          <div key={member.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                            <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                              <Avatar className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0">
                                <AvatarFallback className="bg-gray-100 text-gray-700 text-xs">
                                  {getInitials(member.user.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{member.user.name}</p>
                                <p className="text-xs text-gray-500 truncate">{member.user.email}</p>
                              </div>
                            </div>
                            <Badge className={`text-xs ${getRoleBadgeStyles(member.employeeRole)} flex-shrink-0 text-center justify-center`}>
                              {member.employeeRole.replace(/_/g, ' ')}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-gray-50 px-4 sm:px-6 py-4 flex items-center justify-between border-t border-gray-100 mt-auto">
                  <div className="flex gap-2 sm:gap-3">
                    <ManageTeamHierarchyDialog
                      teamId={team.id}
                      teamName={`Team ${team.leader.user.name}`}
                      members={team.members}
                    />
                    
                    <ManageTeamDialog 
                      teamId={team.id} 
                      currentLeaderId={team.leader.id} 
                    />
                  </div>
                  
                  <div className="flex gap-2 sm:gap-3">
                    <AssignTeamMemberDialog
                      teamId={team.id}
                      teamName={`Team ${team.leader.user.name}`}
                    />
                    
                    <DeleteTeamDialog 
                      teamId={team.id} 
                      teamName={`Team ${team.leader.user.name}`} 
                    />
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
