'use client';

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Network } from "lucide-react";
import './TeamHierarchy.css';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  children?: TeamMember[];
}

interface TeamHierarchyProps {
  data: TeamMember[];
  currentUserId: string;
}

export function TeamHierarchy({ data, currentUserId }: TeamHierarchyProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Network className="mr-2 h-5 w-5 text-[#3C5A3E]" />
          Reporting Structure
        </CardTitle>
        <CardDescription>Your team hierarchy</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <h3 className="text-lg font-medium mb-4">Team Hierarchy</h3>
          <div className="org-chart">
            {data.map(member => (
              <TeamMemberNode 
                key={member.id} 
                member={member} 
                currentUserId={currentUserId} 
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TeamMemberNode({ member, currentUserId }: { member: TeamMember; currentUserId: string }) {
  const isCurrentUser = member.id === currentUserId;
  const initials = getInitials(member.name);
  
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Executive Director':
        return 'bg-green-100 text-green-800';
      case 'Director':
        return 'bg-blue-100 text-blue-800';
      case 'Joint Director':
        return 'bg-purple-100 text-purple-800';
      case 'Field Officer':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="org-chart-node">
      <div className={`org-chart-content ${isCurrentUser ? 'current-user' : ''}`}>
        <div className="flex items-center gap-3">
          <Avatar className={`h-10 w-10 ${isCurrentUser ? 'bg-green-100' : 'bg-gray-100'}`}>
            <AvatarFallback className={isCurrentUser ? 'text-green-800' : 'text-gray-800'}>
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">
              {member.name} {isCurrentUser && '(You)'}
            </div>
            <div className="text-sm text-muted-foreground">{member.email}</div>
          </div>
        </div>
        <div className={`role-badge ${getRoleBadgeColor(member.role)}`}>
          {member.role}
        </div>
      </div>
      
      {member.children && member.children.length > 0 && (
        <div className="org-chart-children">
          {member.children.map(child => (
            <TeamMemberNode 
              key={child.id} 
              member={child} 
              currentUserId={currentUserId} 
            />
          ))}
        </div>
      )}
    </div>
  );
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase();
} 