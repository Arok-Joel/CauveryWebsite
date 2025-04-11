import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { 
  User, Mail, Phone, Building2, CalendarDays, Users, 
  UserCircle, MapPin, Building, CreditCard, FileText, 
  LayoutGrid, UserCheck, BadgeIndianRupee, ChevronDown, ChevronRight,
  ArrowLeft, Network
} from "lucide-react";
import Link from "next/link";
import { EmployeeRoleSelect } from "@/components/admin/employee-role-select";
import { format } from 'date-fns';
import { Employee, Plot, Commission, SoldPlot, Team, User as PrismaUser } from '@prisma/client';
import { use } from 'react';
import { EmployeeSoldPlots } from "@/app/components/employee/EmployeeSoldPlots";
import { EmployeeOrgChart } from "@/app/components/EmployeeOrgChart";
import { AdminStyleOrgChart } from "@/app/components/AdminStyleOrgChart";
import { TeamHierarchyView } from "@/app/components/TeamHierarchyView";

interface PageProps {
  params: {
    id: string;
  };
}

interface TeamWithMembers extends Team {
  members: (Employee & {
    user: {
      id: string;
      name: string;
      email: string;
    };
    employeeRole: string;
    reportsToId: string | null;
  })[];
  leader: Employee & {
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
}

interface EmployeeWithRelations extends Employee {
  user: PrismaUser;
  reportsTo: (Employee & {
    user: PrismaUser;
  }) | null;
  subordinates: (Employee & {
    user: PrismaUser;
  })[];
  leadsTeam: TeamWithMembers | null;
  memberOfTeam: TeamWithMembers | null;
  commissions: (Commission & {
    soldPlot: SoldPlot;
  })[];
}

// Helper function to build a hierarchical tree structure from flat team members
function buildHierarchicalTree(
  members: (Employee & {
    user: {
      id: string;
      name: string;
      email: string;
    };
    employeeRole: string;
    reportsToId: string | null;
  })[],
  leaderId: string
): any[] {
  // Employees directly reporting to the leader
  const directReports = members.filter(m => 
    m.id !== leaderId && 
    (m.reportsToId === leaderId || (!m.reportsToId && shouldReportTo(m, leaderId, members)))
  );
  
  // Sort by role to ensure Executive Directors come first, then Directors, etc.
  const roleOrder = {
    'EXECUTIVE_DIRECTOR': 1,
    'DIRECTOR': 2,
    'JOINT_DIRECTOR': 3,
    'FIELD_OFFICER': 4
  };
  
  directReports.sort((a, b) => {
    return (roleOrder[a.employeeRole as keyof typeof roleOrder] || 99) - 
           (roleOrder[b.employeeRole as keyof typeof roleOrder] || 99);
  });
  
  // Build the tree recursively
  return directReports.map(employee => {
    // Find children of this employee
    const children = buildHierarchicalTree(members, employee.id);
    
    return {
      id: employee.id,
      name: employee.user.name,
      email: employee.user.email,
      role: employee.employeeRole,
      children: children
    };
  });
}

// Helper function to determine if an employee should report to a leader based on role hierarchy
function shouldReportTo(
  employee: Employee & { employeeRole: string; },
  leaderId: string,
  members: (Employee & { employeeRole: string; id: string; })[]
): boolean {
  const leader = members.find(m => m.id === leaderId);
  if (!leader) return false;
  
  // Role hierarchy - higher number means lower in hierarchy
  const roleHierarchy = {
    'EXECUTIVE_DIRECTOR': 1,
    'DIRECTOR': 2,
    'JOINT_DIRECTOR': 3,
    'FIELD_OFFICER': 4
  };
  
  const leaderRank = roleHierarchy[leader.employeeRole as keyof typeof roleHierarchy] || 99;
  const employeeRank = roleHierarchy[employee.employeeRole as keyof typeof roleHierarchy] || 99;
  
  // Employee should report to leader if employee's rank is higher (numerically) than leader's
  return employeeRank > leaderRank && 
         // Check if there's no other team member between them in hierarchy
         !members.some(m => 
            m.id !== leaderId && m.id !== employee.id &&
            roleHierarchy[m.employeeRole as keyof typeof roleHierarchy] > leaderRank &&
            roleHierarchy[m.employeeRole as keyof typeof roleHierarchy] < employeeRank
         );
}

async function getEmployee(id: string): Promise<EmployeeWithRelations> {
  const employee = await db.employee.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
        },
      },
      reportsTo: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      subordinates: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          user: {
            name: 'asc',
          },
        },
      },
      memberOfTeam: {
        include: {
          leader: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              reportsTo: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              user: {
                name: 'asc',
              },
            },
          },
        },
      },
      leadsTeam: {
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              reportsTo: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              user: {
                name: 'asc',
              },
            },
          },
        },
      },
    },
  });

  if (!employee) {
    notFound();
  }

  // Create a Set to track unique subordinates by ID
  const uniqueSubordinatesIds = new Set<string>();
  let uniqueSubordinates: (Employee & {
    user: {
      id: string;
      name: string;
      email: string;
    };
  })[] = [];

  // Add existing direct subordinates to the Set
  employee.subordinates.forEach(sub => {
    uniqueSubordinatesIds.add(sub.id);
    uniqueSubordinates.push(sub);
  });

  // For Executive Directors, handle reporting structure differently based on role
  if (employee.employeeRole === 'EXECUTIVE_DIRECTOR') {
    // If employee is a team leader, they don't report to anyone
    if (employee.leadsTeam) {
      employee.reportsTo = null;
    }
    
    // If not team leader but Executive Director, set to report to the team leader
    else if (employee.memberOfTeam && employee.memberOfTeam.leader.id !== employee.id) {
      // Only set if not already set (don't override existing relationship)
      if (!employee.reportsTo) {
        employee.reportsTo = employee.memberOfTeam.leader;
      }
    }
  }
  // If not Executive Director but doesn't have a reporting manager, set to team leader
  else if (!employee.reportsTo && employee.memberOfTeam) {
    employee.reportsTo = employee.memberOfTeam.leader;
  }

  // If employee is a team leader, add team members as subordinates if they don't have other reporting relationships
  if (employee.leadsTeam) {
    const teamSubordinates = employee.leadsTeam.members.filter(
      member => member.id !== employee.id && 
                (!member.reportsTo || member.reportsTo.id === employee.id) &&
                !uniqueSubordinatesIds.has(member.id)
    );
    
    teamSubordinates.forEach(sub => {
      uniqueSubordinatesIds.add(sub.id);
      uniqueSubordinates.push(sub);
    });
  }

  // For Executive Directors who aren't team leaders, show people reporting to them
  if (employee.employeeRole === 'EXECUTIVE_DIRECTOR' && employee.memberOfTeam && !employee.leadsTeam) {
    // Find all team members who report to this Executive Director
    const reportingMembers = employee.memberOfTeam.members.filter(
      member => member.id !== employee.id && 
                member.reportsToId === employee.id &&
                !uniqueSubordinatesIds.has(member.id)
    );
    
    reportingMembers.forEach(sub => {
      uniqueSubordinatesIds.add(sub.id);
      uniqueSubordinates.push(sub);
    });
  }

  // If employee is part of a team and has a role that should have subordinates,
  // add appropriate team members as subordinates based on role hierarchy
  if (employee.memberOfTeam) {
    const roleHierarchy = {
      EXECUTIVE_DIRECTOR: 1,
      DIRECTOR: 2,
      JOINT_DIRECTOR: 3,
      FIELD_OFFICER: 4,
    };

    const employeeRoleLevel = roleHierarchy[employee.employeeRole];
    const teamSubordinates = employee.memberOfTeam.members.filter(member => {
      const memberRoleLevel = roleHierarchy[member.employeeRole];
      return (
        member.id !== employee.id &&
        memberRoleLevel > employeeRoleLevel &&
        (!member.reportsTo || member.reportsTo.id === employee.id) &&
        !uniqueSubordinatesIds.has(member.id)
      );
    });

    teamSubordinates.forEach(sub => {
      uniqueSubordinatesIds.add(sub.id);
      uniqueSubordinates.push(sub);
    });
  }

  // Replace the original subordinates array with our deduplicated list
  employee.subordinates = uniqueSubordinates;

  return employee as EmployeeWithRelations;
}

async function getEmployeeCommissions(employeeId: string) {
  const commissions = await db.commission.findMany({
    where: {
      employeeId,
    },
    include: {
      soldPlot: {
        include: {
          plot: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  console.log(`Found ${commissions.length} commissions for employee ${employeeId}`);
  
  // Map the commissions to the expected format for the UI and convert Decimal values to strings
  return commissions.map(commission => ({
    id: commission.id,
    amount: commission.amount.toString(),
    percentage: commission.percentage.toString(),
    soldPlot: {
      id: commission.soldPlot.id,
      plotNumber: commission.soldPlot.plotNumber || '',
      size: commission.soldPlot.size || '',
      price: commission.soldPlot.plot?.price?.toString() || '0',
      dimensions: commission.soldPlot.dimensions || '',
      facing: commission.soldPlot.facing || '',
      plotAddress: commission.soldPlot.plotAddress || '',
      customerName: commission.soldPlot.customerName || '',
      phoneNumber: commission.soldPlot.phoneNumber || '',
      email: commission.soldPlot.email || '',
      address: commission.soldPlot.address || '',
      aadhaarNumber: commission.soldPlot.aadhaarNumber || '',
      soldAt: commission.soldPlot.soldAt || commission.createdAt,
    }
  }));
}

function getRoleBadgeVariant(role: string): "default" | "secondary" | "destructive" | "outline" {
  switch (role) {
    case 'EXECUTIVE_DIRECTOR':
      return "default";
    case 'DIRECTOR':
      return "secondary";
    case 'JOINT_DIRECTOR':
      return "destructive";
    case 'FIELD_OFFICER':
      return "outline";
    default:
      return "secondary";
  }
}

function getRoleBadgeClass(role: string): string {
  switch (role) {
    case 'EXECUTIVE_DIRECTOR':
      return "bg-green-500/10 text-green-700 hover:bg-green-500/20";
    case 'DIRECTOR':
      return "bg-blue-500/10 text-blue-700 hover:bg-blue-500/20";
    case 'JOINT_DIRECTOR':
      return "bg-purple-500/10 text-purple-700 hover:bg-purple-500/20";
    case 'FIELD_OFFICER':
      return "bg-orange-500/10 text-orange-700 hover:bg-orange-500/20";
    default:
      return "";
  }
}

function formatRole(role: string) {
  return role.replace(/_/g, " ").replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

function formatDate(date: string | Date) {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
  return format(d, 'MMMM d, yyyy');
}

export default async function EmployeePage({ params }: PageProps) {
  const { id } = await params;
  const [employee, commissions] = await Promise.all([
    getEmployee(id),
    getEmployeeCommissions(id)
  ]);

  if (!employee) {
    notFound();
  }
  
  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Back Button */}
      <Link
        href="/admin/employees"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Employees
      </Link>

      {/* Header with Avatar */}
      <div className="flex items-center gap-6 pb-4 border-b">
        <Avatar className="h-24 w-24">
          <AvatarFallback className="text-2xl bg-primary/10">
            {employee.user.name.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-3xl font-bold">{employee.user.name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge className={`text-sm ${getRoleBadgeClass(employee.employeeRole)}`}>
              {formatRole(employee.employeeRole)}
            </Badge>
            {employee.memberOfTeam && (
              <Badge variant="outline" className="text-sm">
                Team Member
              </Badge>
            )}
            {employee.leadsTeam && (
              <Badge variant="outline" className="text-sm">
                Team Leader
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Team Information */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Contact Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{employee.user.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{employee.user.phone || 'Not provided'}</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{employee.user.address || 'Not provided'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserCircle className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Personal Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Guardian Name</p>
                <p className="font-medium">{employee.guardianName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gender</p>
                <p className="font-medium">{employee.gender}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date of Birth</p>
                <p className="font-medium">{formatDate(employee.dateOfBirth)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Age</p>
                <p className="font-medium">{employee.age} years</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employment Details */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Employment Details</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Joining Date</p>
                <p className="font-medium">{formatDate(employee.dateOfJoining)}</p>
              </div>
            </div>
            {employee.reportsTo && (
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Reports To</p>
                  <p className="font-medium">{employee.reportsTo.user.name}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bank Details */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Bank Details</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Bank Name</p>
                <p className="font-medium">{employee.bankName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Branch</p>
                <p className="font-medium">{employee.bankBranch}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Account Number</p>
                <p className="font-medium">{employee.accountNumber}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">IFSC Code</p>
                <p className="font-medium">{employee.ifscCode}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ID Details */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <CardTitle>ID Details</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">PAN Card Number</p>
                <p className="font-medium">{employee.pancardNumber}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Aadhaar Card Number</p>
                <p className="font-medium">{employee.aadharCardNumber}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sold Plots Information */}
      <EmployeeSoldPlots 
        initialCommissions={commissions} 
        employeeId={id}
        employeeName={employee.user.name}
      />
    </div>
  );
}