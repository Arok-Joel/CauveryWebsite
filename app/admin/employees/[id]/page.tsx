import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  ArrowLeft
} from "lucide-react";
import Link from "next/link";
import { EmployeeRoleSelect } from "@/components/admin/employee-role-select";
import { format } from 'date-fns';
import { Employee, Plot, Commission, SoldPlot, Team, User as PrismaUser } from '@prisma/client';
import { use } from 'react';
import { EmployeeSoldPlots } from "@/app/components/employee/EmployeeSoldPlots";

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

  // If employee is part of a team but doesn't have a direct reportsTo relationship,
  // use the team leader as their reporting manager
  if (!employee.reportsTo && employee.memberOfTeam) {
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
  const id = params.id;
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

        {/* Reporting Structure */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Reporting Structure</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {/* Reports To Section */}
              <div>
                <h3 className="text-sm font-medium mb-4">Reports To</h3>
                {employee.reportsTo ? (
                  <Link 
                    href={`/admin/employees/${employee.reportsTo.id}`}
                    className="flex items-center gap-3 p-4 bg-white border border-muted rounded-lg hover:bg-muted/10 transition-colors"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10">
                        {employee.reportsTo.user.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{employee.reportsTo.user.name}</p>
                      <Badge className={`mt-1 ${getRoleBadgeClass(employee.reportsTo.employeeRole)}`}>
                        {formatRole(employee.reportsTo.employeeRole)}
                      </Badge>
                    </div>
                  </Link>
                ) : (
                  <div className="p-4 bg-white border border-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">No direct reporting manager</p>
                  </div>
                )}
              </div>

              {/* Direct Reports Section */}
              <div>
                <h3 className="text-sm font-medium mb-4">Direct Reports</h3>
                {employee.subordinates.length > 0 ? (
                  <div className="space-y-3">
                    {employee.subordinates.map((subordinate, index) => (
                      <Link
                        key={`direct-report-${subordinate.id}-${index}`}
                        href={`/admin/employees/${subordinate.id}`}
                        className="flex items-center gap-3 p-4 bg-white border border-muted rounded-lg hover:bg-muted/10 transition-colors"
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10">
                            {subordinate.user.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{subordinate.user.name}</p>
                          <Badge className={`mt-1 ${getRoleBadgeClass(subordinate.employeeRole)}`}>
                            {formatRole(subordinate.employeeRole)}
                          </Badge>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-white border border-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">No direct reports</p>
                  </div>
                )}
              </div>

              {/* Team Structure Section */}
              {(employee.memberOfTeam || employee.leadsTeam) && (
                <div>
                  <h3 className="text-sm font-medium mb-4">Team Structure</h3>
                  
                  {/* Border container for the entire team structure */}
                  <div className="border rounded-lg p-4 space-y-6">
                    {/* Team Leader Row */}
                    <div>
                      <p className="font-medium text-sm text-muted-foreground mb-2">Team Leader</p>
                      {employee.leadsTeam ? (
                        // Current employee is the team leader
                        <div className="flex items-center gap-3 p-4 bg-white border border-muted rounded-lg">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10">
                              {employee.user.name.split(' ').map((n: string) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {employee.user.name}
                              <span className="ml-2 text-sm text-primary font-normal">(You)</span>
                            </p>
                            <Badge className={`mt-1 ${getRoleBadgeClass(employee.employeeRole)}`}>
                              {formatRole(employee.employeeRole)}
                            </Badge>
                          </div>
                        </div>
                      ) : employee.memberOfTeam && (
                        // Current employee is a team member
                        <Link
                          href={`/admin/employees/${employee.memberOfTeam.leader.id}`}
                          className="flex items-center gap-3 p-4 bg-white border border-muted rounded-lg hover:bg-muted/10 transition-colors"
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10">
                              {employee.memberOfTeam.leader.user.name.split(' ').map((n: string) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {employee.memberOfTeam.leader.user.name}
                              {employee.memberOfTeam.leader.id === employee.id && 
                                <span className="ml-2 text-sm text-primary font-normal">(You)</span>
                              }
                            </p>
                            <Badge className={`mt-1 ${getRoleBadgeClass(employee.memberOfTeam.leader.employeeRole)}`}>
                              {formatRole(employee.memberOfTeam.leader.employeeRole)}
                            </Badge>
                          </div>
                        </Link>
                      )}
                    </div>
                    
                    {/* Team Members */}
                    <div className="ml-6 border-l-2 border-muted pl-4 space-y-3">
                      <p className="font-medium text-sm text-muted-foreground mb-4 -ml-30 mt-4">Team Members</p>
                      
                      {/* Create a tree-like structure */}
                      <div className="space-y-4">
                        {(() => {
                          // Define member type
                          type TeamMember = Employee & {
                            user: {
                              id: string;
                              name: string;
                              email: string;
                            };
                            employeeRole: string;
                            reportsToId: string | null;
                          };

                          // Get all team members with proper typing
                          const allMembers: TeamMember[] = 
                            (employee.leadsTeam?.members as TeamMember[]) || 
                            (employee.memberOfTeam?.members as TeamMember[]) || 
                            [];
                          
                          // Get the team leader ID
                          const leaderId = employee.leadsTeam 
                            ? employee.id 
                            : employee.memberOfTeam?.leader?.id;
                          
                          // Find directors (exclude team leader)
                          const directors = allMembers.filter((m: TeamMember) => 
                            m.employeeRole === 'DIRECTOR' && m.id !== leaderId
                          );
                          
                          // Find joint directors
                          const jointDirectors = allMembers.filter((m: TeamMember) => 
                            m.employeeRole === 'JOINT_DIRECTOR'
                          );
                          
                          // Find field officers
                          const fieldOfficers = allMembers.filter((m: TeamMember) => 
                            m.employeeRole === 'FIELD_OFFICER'
                          );
                          
                          return (
                            <>
                              {/* Directors */}
                              {directors.map(director => (
                                <div key={director.id} className="relative">
                                  {/* Horizontal connector line */}
                                  <div className="absolute -left-4 top-1/2 w-4 h-px bg-muted"></div>
                                  
                                  <Link
                                    href={`/admin/employees/${director.id}`}
                                    className={`flex items-center gap-3 p-4 rounded-lg transition-colors ${
                                      director.id === employee.id
                                        ? 'bg-muted/30 border border-muted/50'
                                        : 'bg-white border border-muted hover:bg-muted/10'
                                    }`}
                                  >
                                    <Avatar className="h-10 w-10">
                                      <AvatarFallback className="bg-primary/10">
                                        {director.user.name.split(' ').map((n: string) => n[0]).join('')}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="font-medium">
                                        {director.user.name}
                                        {director.id === employee.id && 
                                          <span className="ml-2 text-sm text-primary font-normal">(You)</span>
                                        }
                                      </p>
                                      <Badge className={`mt-1 ${getRoleBadgeClass(director.employeeRole)}`}>
                                        {formatRole(director.employeeRole)}
                                      </Badge>
                                    </div>
                                  </Link>
                                  
                                  {/* Joint Directors under this Director */}
                                  {jointDirectors.some(jd => jd.reportsToId === director.id) && (
                                    <div className="pl-8 ml-4 mt-2 space-y-2 border-l-2 border-muted">
                                      {jointDirectors
                                        .filter(jd => jd.reportsToId === director.id)
                                        .map(jointDirector => (
                                          <div key={jointDirector.id} className="relative">
                                            {/* Horizontal connector line */}
                                            <div className="absolute -left-4 top-1/2 w-4 h-px bg-muted"></div>
                                            
                                            <Link
                                              href={`/admin/employees/${jointDirector.id}`}
                                              className={`flex items-center gap-3 p-4 rounded-lg transition-colors ${
                                                jointDirector.id === employee.id
                                                  ? 'bg-muted/30 border border-muted/50'
                                                  : 'bg-white border border-muted hover:bg-muted/10'
                                              }`}
                                            >
                                              <Avatar className="h-10 w-10">
                                                <AvatarFallback className="bg-primary/10">
                                                  {jointDirector.user.name.split(' ').map((n: string) => n[0]).join('')}
                                                </AvatarFallback>
                                              </Avatar>
                                              <div>
                                                <p className="font-medium">
                                                  {jointDirector.user.name}
                                                  {jointDirector.id === employee.id && 
                                                    <span className="ml-2 text-sm text-primary font-normal">(You)</span>
                                                  }
                                                </p>
                                                <Badge className={`mt-1 ${getRoleBadgeClass(jointDirector.employeeRole)}`}>
                                                  {formatRole(jointDirector.employeeRole)}
                                                </Badge>
                                              </div>
                                            </Link>
                                            
                                            {/* Field Officers under this Joint Director */}
                                            {fieldOfficers.some(fo => fo.reportsToId === jointDirector.id) && (
                                              <div className="pl-8 ml-4 mt-2 space-y-2 border-l-2 border-muted">
                                                {fieldOfficers
                                                  .filter(fo => fo.reportsToId === jointDirector.id)
                                                  .map(fieldOfficer => (
                                                    <div key={fieldOfficer.id} className="relative">
                                                      {/* Horizontal connector line */}
                                                      <div className="absolute -left-4 top-1/2 w-4 h-px bg-muted"></div>
                                                      
                                                      <Link
                                                        href={`/admin/employees/${fieldOfficer.id}`}
                                                        className={`flex items-center gap-3 p-4 rounded-lg transition-colors ${
                                                          fieldOfficer.id === employee.id
                                                            ? 'bg-muted/30 border border-muted/50'
                                                            : 'bg-white border border-muted hover:bg-muted/10'
                                                        }`}
                                                      >
                                                        <Avatar className="h-10 w-10">
                                                          <AvatarFallback className="bg-primary/10">
                                                            {fieldOfficer.user.name.split(' ').map((n: string) => n[0]).join('')}
                                                          </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                          <p className="font-medium">
                                                            {fieldOfficer.user.name}
                                                            {fieldOfficer.id === employee.id && 
                                                              <span className="ml-2 text-sm text-primary font-normal">(You)</span>
                                                            }
                                                          </p>
                                                          <Badge className={`mt-1 ${getRoleBadgeClass(fieldOfficer.employeeRole)}`}>
                                                            {formatRole(fieldOfficer.employeeRole)}
                                                          </Badge>
                                                        </div>
                                                      </Link>
                                                    </div>
                                                  ))}
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                    </div>
                                  )}
                                  
                                  {/* Field Officers directly under this Director */}
                                  {fieldOfficers.some(fo => fo.reportsToId === director.id) && (
                                    <div className="pl-8 ml-4 mt-2 space-y-2 border-l-2 border-muted">
                                      {fieldOfficers
                                        .filter(fo => fo.reportsToId === director.id)
                                        .map(fieldOfficer => (
                                          <div key={fieldOfficer.id} className="relative">
                                            {/* Horizontal connector line */}
                                            <div className="absolute -left-4 top-1/2 w-4 h-px bg-muted"></div>
                                            
                                            <Link
                                              href={`/admin/employees/${fieldOfficer.id}`}
                                              className={`flex items-center gap-3 p-4 rounded-lg transition-colors ${
                                                fieldOfficer.id === employee.id
                                                  ? 'bg-muted/30 border border-muted/50'
                                                  : 'bg-white border border-muted hover:bg-muted/10'
                                              }`}
                                            >
                                              <Avatar className="h-10 w-10">
                                                <AvatarFallback className="bg-primary/10">
                                                  {fieldOfficer.user.name.split(' ').map((n: string) => n[0]).join('')}
                                                </AvatarFallback>
                                              </Avatar>
                                              <div>
                                                <p className="font-medium">
                                                  {fieldOfficer.user.name}
                                                  {fieldOfficer.id === employee.id && 
                                                    <span className="ml-2 text-sm text-primary font-normal">(You)</span>
                                                  }
                                                </p>
                                                <Badge className={`mt-1 ${getRoleBadgeClass(fieldOfficer.employeeRole)}`}>
                                                  {formatRole(fieldOfficer.employeeRole)}
                                                </Badge>
                                              </div>
                                            </Link>
                                          </div>
                                        ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                              
                              {/* Joint Directors that report directly to the Team Leader */}
                              {jointDirectors
                                .filter(jd => jd.reportsToId === leaderId)
                                .map(jointDirector => (
                                  <div key={jointDirector.id} className="relative">
                                    {/* Horizontal connector line */}
                                    <div className="absolute -left-4 top-1/2 w-4 h-px bg-muted"></div>
                                    
                                    <Link
                                      href={`/admin/employees/${jointDirector.id}`}
                                      className={`flex items-center gap-3 p-4 rounded-lg transition-colors ${
                                        jointDirector.id === employee.id
                                          ? 'bg-muted/30 border border-muted/50'
                                          : 'bg-white border border-muted hover:bg-muted/10'
                                      }`}
                                    >
                                      <Avatar className="h-10 w-10">
                                        <AvatarFallback className="bg-primary/10">
                                          {jointDirector.user.name.split(' ').map((n: string) => n[0]).join('')}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <p className="font-medium">
                                          {jointDirector.user.name}
                                          {jointDirector.id === employee.id && 
                                            <span className="ml-2 text-sm text-primary font-normal">(You)</span>
                                          }
                                        </p>
                                        <Badge className={`mt-1 ${getRoleBadgeClass(jointDirector.employeeRole)}`}>
                                          {formatRole(jointDirector.employeeRole)}
                                        </Badge>
                                      </div>
                                    </Link>
                                    
                                    {/* Field Officers under this Joint Director */}
                                    {fieldOfficers.some(fo => fo.reportsToId === jointDirector.id) && (
                                      <div className="pl-8 ml-4 mt-2 space-y-2 border-l-2 border-muted">
                                        {fieldOfficers
                                          .filter(fo => fo.reportsToId === jointDirector.id)
                                          .map(fieldOfficer => (
                                            <div key={fieldOfficer.id} className="relative">
                                              {/* Horizontal connector line */}
                                              <div className="absolute -left-4 top-1/2 w-4 h-px bg-muted"></div>
                                              
                                              <Link
                                                href={`/admin/employees/${fieldOfficer.id}`}
                                                className={`flex items-center gap-3 p-4 rounded-lg transition-colors ${
                                                  fieldOfficer.id === employee.id
                                                    ? 'bg-muted/30 border border-muted/50'
                                                    : 'bg-white border border-muted hover:bg-muted/10'
                                                }`}
                                              >
                                                <Avatar className="h-10 w-10">
                                                  <AvatarFallback className="bg-primary/10">
                                                    {fieldOfficer.user.name.split(' ').map((n: string) => n[0]).join('')}
                                                  </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                  <p className="font-medium">
                                                    {fieldOfficer.user.name}
                                                    {fieldOfficer.id === employee.id && 
                                                      <span className="ml-2 text-sm text-primary font-normal">(You)</span>
                                                    }
                                                  </p>
                                                  <Badge className={`mt-1 ${getRoleBadgeClass(fieldOfficer.employeeRole)}`}>
                                                    {formatRole(fieldOfficer.employeeRole)}
                                                  </Badge>
                                                </div>
                                              </Link>
                                            </div>
                                          ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              
                              {/* Field Officers that report directly to the Team Leader */}
                              {fieldOfficers
                                .filter(fo => fo.reportsToId === leaderId)
                                .map(fieldOfficer => (
                                  <div key={fieldOfficer.id} className="relative">
                                    {/* Horizontal connector line */}
                                    <div className="absolute -left-4 top-1/2 w-4 h-px bg-muted"></div>
                                    
                                    <Link
                                      href={`/admin/employees/${fieldOfficer.id}`}
                                      className={`flex items-center gap-3 p-4 rounded-lg transition-colors ${
                                        fieldOfficer.id === employee.id
                                          ? 'bg-muted/30 border border-muted/50'
                                          : 'bg-white border border-muted hover:bg-muted/10'
                                      }`}
                                    >
                                      <Avatar className="h-10 w-10">
                                        <AvatarFallback className="bg-primary/10">
                                          {fieldOfficer.user.name.split(' ').map((n: string) => n[0]).join('')}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <p className="font-medium">
                                          {fieldOfficer.user.name}
                                          {fieldOfficer.id === employee.id && 
                                            <span className="ml-2 text-sm text-primary font-normal">(You)</span>
                                          }
                                        </p>
                                        <Badge className={`mt-1 ${getRoleBadgeClass(fieldOfficer.employeeRole)}`}>
                                          {formatRole(fieldOfficer.employeeRole)}
                                        </Badge>
                                      </div>
                                    </Link>
                                  </div>
                                ))}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              )}
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