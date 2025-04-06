'use client';

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
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
    <div className="org-hierarchy-chart">
      <div className="space-y-4">
        <OrgChartMember
          member={data}
          currentUserId={currentUserId}
          level={0}
          showChildren={true}
        />
      </div>
    </div>
  );
}

function OrgChartMember({ 
  member, 
  currentUserId, 
  level = 0,
  showChildren = true
}: { 
  member: TeamMember; 
  currentUserId: string;
  level: number;
  showChildren?: boolean;
}) {
  const isCurrentUser = member.id === currentUserId;
  const isLeader = level === 0;
  const initials = getInitials(member.name);
  
  // Different background colors based on role
  const bgColor = isLeader 
    ? 'bg-green-50' 
    : member.role === 'DIRECTOR' 
      ? 'bg-blue-50' 
      : member.role === 'JOINT_DIRECTOR' 
        ? 'bg-violet-50' 
        : 'bg-orange-50';
  
  return (
    <div className="team-hierarchy-member">
      {/* Main employee card */}
      <div className={`p-3 ${bgColor} rounded-lg border ${isCurrentUser ? 'border-primary/30' : 'border-gray-200'}`}>
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">
              {member.name}
              {isCurrentUser && <span className="ml-1 text-xs text-primary">(You)</span>}
            </p>
            <Badge variant="outline" className={`text-xs px-1.5 py-0 ${getRoleBadgeClass(member.role)}`}>
              {formatRole(member.role)}
            </Badge>
          </div>
        </div>
      </div>
      
      {/* Children with connecting lines */}
      {showChildren && member.children && member.children.length > 0 && (
        <div className="pl-6 ml-2 mt-2 space-y-2 border-l border-gray-200">
          {member.children.map((child, index) => (
            <div key={`${child.id}-${index}`} className="relative">
              {/* Horizontal connector line */}
              <div className="absolute -left-2 top-4 w-2 h-px bg-gray-200"></div>
              <OrgChartMember 
                member={child}
                currentUserId={currentUserId}
                level={level + 1}
                showChildren={true}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getRoleBadgeClass(role: string): string {
  switch (role) {
    case 'EXECUTIVE_DIRECTOR':
      return "bg-green-100 text-green-800";
    case 'DIRECTOR':
      return "bg-blue-100 text-blue-800";
    case 'JOINT_DIRECTOR':
      return "bg-purple-100 text-purple-800";
    case 'FIELD_OFFICER':
      return "bg-orange-100 text-orange-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
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