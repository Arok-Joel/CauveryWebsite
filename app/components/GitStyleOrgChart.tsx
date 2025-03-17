'use client';

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import './GitStyleOrgChart.css';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  children?: TeamMember[];
}

interface GitStyleOrgChartProps {
  data: TeamMember;
  currentUserId: string;
}

export function GitStyleOrgChart({ data, currentUserId }: GitStyleOrgChartProps) {
  return (
    <div className="git-chart">
      <TeamMemberNode 
        node={data} 
        currentUserId={currentUserId} 
      />
    </div>
  );
}

function TeamMemberNode({ node, currentUserId }: { 
  node: TeamMember; 
  currentUserId: string;
}) {
  const isCurrentUser = node.id === currentUserId;
  const initials = getInitials(node.name);
  
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'EXECUTIVE_DIRECTOR':
        return 'bg-green-100 text-green-800';
      case 'DIRECTOR':
        return 'bg-blue-100 text-blue-800';
      case 'JOINT_DIRECTOR':
        return 'bg-purple-100 text-purple-800';
      case 'FIELD_OFFICER':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="git-node">
      <div className={`git-content ${isCurrentUser ? 'current-user' : ''}`}>
        <div className="flex items-center gap-2 overflow-hidden">
          <Avatar className={`h-8 w-8 flex-shrink-0 ${isCurrentUser ? 'bg-green-100' : 'bg-gray-100'}`}>
            <AvatarFallback className={isCurrentUser ? 'text-green-800' : 'text-gray-800'}>
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="overflow-hidden">
            <div className="font-medium text-sm truncate">
              {node.name} {isCurrentUser && '(You)'}
            </div>
            <div className="text-xs text-muted-foreground truncate">{node.email}</div>
          </div>
        </div>
        <div className={`role-badge ${getRoleBadgeColor(node.role)}`}>
          {formatRole(node.role)}
        </div>
      </div>
      
      {node.children && node.children.length > 0 && (
        <div className="git-children">
          {node.children.map(child => (
            <TeamMemberNode 
              key={child.id} 
              node={child} 
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function formatRole(role: string): string {
  return role
    .replace(/_/g, ' ')
    .replace(/\w\S*/g, (txt) => {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase();
} 