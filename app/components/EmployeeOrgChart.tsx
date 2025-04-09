'use client';

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

// This is a simplified version of the interface in the admin page
interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  children?: TeamMember[];
}

interface EmployeeOrgChartProps {
  data: TeamMember;
  currentUserId: string;
  isAdmin?: boolean; // To adjust behavior for admin vs employee views
}

function getRoleStyles(role: string) {
  switch (role) {
    case 'EXECUTIVE_DIRECTOR':
      return {
        bg: 'bg-emerald-50 hover:bg-emerald-100',
        badge: 'bg-emerald-100 text-emerald-800',
        border: 'border-emerald-500',
        dot: 'bg-emerald-500',
      };

    case 'DIRECTOR':
      return {
        bg: 'bg-sky-50 hover:bg-sky-100',
        badge: 'bg-sky-100 text-sky-800',
        border: 'border-sky-500',
        dot: 'bg-sky-500',
      };

    case 'JOINT_DIRECTOR':
      return {
        bg: 'bg-violet-50 hover:bg-violet-100',
        badge: 'bg-violet-100 text-violet-800',
        border: 'border-violet-500',
        dot: 'bg-violet-500',
      };

    case 'FIELD_OFFICER':
      return {
        bg: 'bg-orange-50 hover:bg-orange-100',
        badge: 'bg-orange-100 text-orange-800',
        border: 'border-orange-500',
        dot: 'bg-orange-500',
      };

    default:
      return {
        bg: 'bg-slate-50 hover:bg-slate-100',
        badge: 'bg-slate-100 text-slate-800',
        border: 'border-slate-500',
        dot: 'bg-slate-500',
      };
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

export function EmployeeOrgChart({ data, currentUserId, isAdmin = false }: EmployeeOrgChartProps) {
  return (
    <div className="space-y-6">
      <EmployeeNode 
        member={data} 
        currentUserId={currentUserId} 
        level={0} 
        isAdmin={isAdmin} 
      />
    </div>
  );
}

function EmployeeNode({ 
  member, 
  currentUserId, 
  level = 0,
  isAdmin = false,
  parentId = ''
}: { 
  member: TeamMember; 
  currentUserId: string;
  level: number;
  isAdmin?: boolean;
  parentId?: string;
}) {
  const isCurrentUser = member.id === currentUserId;
  const styles = getRoleStyles(member.role);
  const isTeamLeader = level === 0;

  // Create the node content
  const nodeContent = (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback className={`${isCurrentUser ? styles.badge : 'bg-gray-100'}`}>
            {getInitials(member.name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">
            {member.name}
            {isCurrentUser && <span className="ml-2 text-sm text-primary font-normal">(You)</span>}
          </p>
          <p className="text-sm text-gray-500">{member.email}</p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {isTeamLeader && (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
            Team Leader
          </span>
        )}

        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles.badge}`}
        >
          {formatRole(member.role)}
        </span>
      </div>
    </div>
  );

  return (
    <div
      className="relative"
      style={{
        marginLeft: level > 0 ? `${level * 2}rem` : 0,
        marginBottom: '0.5rem',
      }}
    >
      {level > 0 && (
        <>
          {/* Vertical line */}
          <div
            className="absolute border-l-2 border-gray-200"
            style={{
              left: '-1rem',
              top: '-0.5rem',
              height: 'calc(100% + 1rem)',
            }}
          />

          {/* Horizontal line */}
          <div
            className="absolute border-t-2 border-gray-200"
            style={{
              left: '-1rem',
              width: '1rem',
              top: '1.5rem',
            }}
          />
        </>
      )}

      {/* Conditionally render as Link or Div */}
      {isAdmin ? (
        <Link 
          href={`/admin/employees/${member.id}`}
          className={`block ${styles.bg} rounded-lg p-4 ${isCurrentUser ? `border-2 ${styles.border}` : 'border border-gray-200'} transition-all duration-200 hover:shadow-md`}
        >
          {nodeContent}
        </Link>
      ) : (
        <div className={`${styles.bg} rounded-lg p-4 ${isCurrentUser ? `border-2 ${styles.border}` : 'border border-gray-200'} transition-all duration-200`}>
          {nodeContent}
        </div>
      )}

      {/* Render children */}
      {member.children && member.children.length > 0 && (
        <div className="mt-2">
          {member.children.map((child, index) => (
            <EmployeeNode 
              key={`${child.id}-child-of-${member.id}-${index}`}
              member={child} 
              currentUserId={currentUserId}
              level={level + 1}
              isAdmin={isAdmin}
              parentId={member.id}
            />
          ))}
        </div>
      )}
    </div>
  );
} 