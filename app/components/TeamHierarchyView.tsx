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
  isTeamLeader?: boolean;
  children?: TeamMember[];
}

interface TeamHierarchyViewProps {
  data: TeamMember[] | TeamMember; 
  currentUserId?: string;
  isAdmin?: boolean;
  title?: string;
}

// Function to get role badge color
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

function getRoleIconClasses(role: string) {
  switch (role) {
    case 'EXECUTIVE_DIRECTOR':
      return "text-emerald-800";
    case 'DIRECTOR':
      return "text-sky-800";
    case 'JOINT_DIRECTOR':
      return "text-purple-800";
    case 'FIELD_OFFICER':
      return "text-orange-800";
    default:
      return "text-gray-800";
  }
}

function formatRole(role: string): string {
  // Use shorter abbreviations for the roles to save space
  switch (role) {
    case 'EXECUTIVE_DIRECTOR':
      return 'Exec. Dir';
    case 'DIRECTOR':
      return 'Dir';
    case 'JOINT_DIRECTOR':
      return 'Joint Dir';
    case 'FIELD_OFFICER':
      return 'Field Off';
    default:
      return role.replace(/_/g, ' ').replace(/\w\S*/g, (txt) => {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      });
  }
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase();
}

function getRoleIcon(role: string) {
  const iconClasses = getRoleIconClasses(role);
  
  switch (role) {
    case 'EXECUTIVE_DIRECTOR':
      return <Award className={`h-3 w-3 ${iconClasses}`} />;
    case 'DIRECTOR':
      return <UserCheck className={`h-3 w-3 ${iconClasses}`} />;
    case 'JOINT_DIRECTOR':
      return <Users className={`h-3 w-3 ${iconClasses}`} />;
    case 'FIELD_OFFICER':
      return <User className={`h-3 w-3 ${iconClasses}`} />;
    default:
      return null;
  }
}

export function TeamHierarchyView({ data, currentUserId, isAdmin = false, title = "Executive Directors & Their Teams" }: TeamHierarchyViewProps) {
  // Ensure data is in array format 
  const executives = Array.isArray(data) ? data : [data];
  
  return (
    <div className="space-y-1">
      <h3 className="text-base font-semibold mb-1">{title}</h3>
      <div className="space-y-2">
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
    </div>
  );
}

function EmployeeNode({
  employee,
  currentUserId,
  isAdmin,
  level = 0,
  parentId = '',
}: {
  employee: TeamMember;
  currentUserId?: string;
  isAdmin?: boolean;
  level?: number;
  parentId?: string;
}) {
  const isCurrentUser = currentUserId && employee.id === currentUserId;
  const isTeamLeader = level === 0 && employee.role === 'EXECUTIVE_DIRECTOR';
  const badge = getRoleBadge(employee.role);
  
  // Create node classes based on role
  let bgClass = "";
  switch (employee.role) {
    case 'EXECUTIVE_DIRECTOR':
      bgClass = "bg-emerald-50";
      break;
    case 'DIRECTOR':
      bgClass = "bg-sky-50";
      break;
    case 'JOINT_DIRECTOR':
      bgClass = "bg-violet-50";
      break;
    case 'FIELD_OFFICER':
      bgClass = "bg-orange-50";
      break;
    default:
      bgClass = "bg-gray-50";
  }

  // Match the exact styling from the admin/employees page
  return (
    <div
      className="relative"
      style={{
        marginLeft: level > 0 ? `${level * 1.25}rem` : 0,
      }}
    >
      {level > 0 && (
        <>
          {/* Vertical line */}
          <div
            className="absolute border-l-2 border-gray-200"
            style={{
              left: '-0.75rem',
              top: '-0.5rem',
              height: 'calc(100% + 0.5rem)',
              zIndex: 1,
            }}
          />
          
          {/* Horizontal line */}
          <div
            className="absolute border-t-2 border-gray-200"
            style={{
              left: '-0.75rem',
              width: '0.75rem',
              top: '1rem',
              zIndex: 1,
            }}
          />
        </>
      )}
      
      {isAdmin ? (
        <Link
          href={`/admin/employees/${employee.id}`}
          className={`flex items-center justify-between mb-1 p-2 rounded-lg ${bgClass} border border-gray-200 ${isCurrentUser ? 'ring-1 ring-primary' : ''}`}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Avatar className="h-7 w-7 flex-shrink-0">
              <AvatarFallback className={`${isCurrentUser ? badge : 'bg-gray-100'} text-xs`}>
                {getInitials(employee.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-medium text-xs truncate">
                {employee.name}
                {isCurrentUser && <span className="ml-1 text-xs text-primary">(You)</span>}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 flex-shrink-0">
            {isTeamLeader && (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-800">
                Lead
              </span>
            )}
            
            <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${badge}`}>
              {formatRole(employee.role)}
            </span>
          </div>
        </Link>
      ) : (
        <div className={`flex items-center justify-between mb-1 p-2 rounded-lg ${bgClass} border border-gray-200 ${isCurrentUser ? 'ring-1 ring-primary' : ''}`}>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Avatar className="h-7 w-7 flex-shrink-0">
              <AvatarFallback className={`${isCurrentUser ? badge : 'bg-gray-100'} text-xs`}>
                {getInitials(employee.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-medium text-xs truncate">
                {employee.name}
                {isCurrentUser && <span className="ml-1 text-xs text-primary">(You)</span>}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 flex-shrink-0">
            {isTeamLeader && (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-800">
                Lead
              </span>
            )}
            
            <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${badge}`}>
              {formatRole(employee.role)}
            </span>
          </div>
        </div>
      )}
      
      {/* Render children */}
      {employee.children && employee.children.length > 0 && (
        <div className="mt-1">
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