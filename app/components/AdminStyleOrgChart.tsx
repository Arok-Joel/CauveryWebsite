'use client';

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Users, User, UserCheck, Award } from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  children?: TeamMember[];
}

interface AdminStyleOrgChartProps {
  data: TeamMember[] | TeamMember;
  currentUserId: string;
  isAdmin?: boolean;
}

// Get role badge colors based on role
function getRoleBadge(role: string) {
  switch (role) {
    case 'EXECUTIVE_DIRECTOR':
      return "bg-emerald-100 text-emerald-800";
    case 'DIRECTOR':
      return "bg-sky-100 text-sky-800";
    case 'JOINT_DIRECTOR':
      return "bg-violet-100 text-purple-800";
    case 'FIELD_OFFICER':
      return "bg-orange-100 text-orange-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

// Function to get background color based on role
function getRoleBackground(role: string) {
  switch (role) {
    case 'EXECUTIVE_DIRECTOR':
      return "bg-emerald-50";
    case 'DIRECTOR':
      return "bg-sky-50";
    case 'JOINT_DIRECTOR':
      return "bg-violet-50";
    case 'FIELD_OFFICER':
      return "bg-orange-50";
    default:
      return "bg-gray-50";
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

// Add function to get role icon
function getRoleIcon(role: string) {
  switch (role) {
    case 'EXECUTIVE_DIRECTOR':
      return <Award className="h-3.5 w-3.5 mr-1" />;
    case 'DIRECTOR':
      return <UserCheck className="h-3.5 w-3.5 mr-1" />;
    case 'JOINT_DIRECTOR':
      return <Users className="h-3.5 w-3.5 mr-1" />;
    case 'FIELD_OFFICER':
      return <User className="h-3.5 w-3.5 mr-1" />;
    default:
      return null;
  }
}

export function AdminStyleOrgChart({ data, currentUserId, isAdmin = false }: AdminStyleOrgChartProps) {
  // If we just have one item, wrap it in an array
  const executives = Array.isArray(data) ? data : [data];

  return (
    <div className="space-y-8">
      {executives.map((executive, index) => (
        <EmployeeNode
          key={`exec-${executive.id}-${index}`}
          employee={executive}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          level={0}
        />
      ))}
    </div>
  );
}

function EmployeeNode({
  employee,
  currentUserId,
  isAdmin = false,
  level = 0,
  parentId = '',
}: {
  employee: TeamMember;
  currentUserId: string;
  isAdmin?: boolean;
  level?: number;
  parentId?: string;
}) {
  const isCurrentUser = employee.id === currentUserId;
  const isTeamLeader = level === 0 && employee.role === 'EXECUTIVE_DIRECTOR';
  const bg = getRoleBackground(employee.role);
  const badge = getRoleBadge(employee.role);

  // Create the base node content
  const nodeContent = (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback className={isCurrentUser ? badge : 'bg-gray-100'}>
            {getInitials(employee.name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">
            {employee.name}
            {isCurrentUser && <span className="ml-2 text-xs text-primary font-normal">(You)</span>}
          </p>
          <p className="text-sm text-gray-500">{employee.email}</p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {isTeamLeader && (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
            Team Leader
          </span>
        )}
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge}`}>
          {getRoleIcon(employee.role)}
          {formatRole(employee.role)}
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
      {/* Connection lines */}
      {level > 0 && (
        <>
          {/* Vertical line */}
          <div
            className="absolute border-l-2 border-gray-200"
            style={{
              left: '-1rem',
              top: '-0.5rem',
              height: 'calc(100% + 0.5rem)',
              zIndex: 1,
            }}
          />

          {/* Horizontal line */}
          <div
            className="absolute border-t-2 border-gray-200"
            style={{
              left: '-1rem',
              width: '1rem',
              top: '1.5rem',
              zIndex: 1,
            }}
          />
        </>
      )}

      {/* Employee card */}
      {isAdmin ? (
        <Link
          href={`/admin/employees/${employee.id}`}
          className={`block ${bg} rounded-lg p-4 border ${isCurrentUser ? 'border-primary/50' : 'border-gray-200'} transition-all duration-200 hover:shadow-md`}
        >
          {nodeContent}
        </Link>
      ) : (
        <div className={`${bg} rounded-lg p-4 border ${isCurrentUser ? 'border-primary/50' : 'border-gray-200'}`}>
          {nodeContent}
        </div>
      )}

      {/* Child nodes */}
      {employee.children && employee.children.length > 0 && (
        <div className="mt-2">
          {employee.children.map((child, index) => (
            <EmployeeNode
              key={`${child.id}-child-of-${employee.id}-${index}`}
              employee={child}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              level={level + 1}
              parentId={employee.id}
            />
          ))}
        </div>
      )}
    </div>
  );
} 