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
import { Employee, Plot, Commission, SoldPlot, Team } from '@prisma/client';

interface PageProps {
  params: {
    id: string;
  };
}

interface EmployeeWithRelations extends Employee {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    address?: string | null;
  };
  reportsTo: (Employee & {
    user: {
      id: string;
      name: string;
      email: string;
    };
  }) | null;
  subordinates: (Employee & {
    user: {
      id: string;
      name: string;
      email: string;
    };
  })[];
  memberOfTeam: (Team & {
    leader: Employee & {
      user: {
        id: string;
        name: string;
        email: string;
      };
    };
    members: (Employee & {
      user: {
        id: string;
        name: string;
        email: string;
      };
    })[];
  }) | null;
  leadsTeam: (Team & {
    members: (Employee & {
      user: {
        id: string;
        name: string;
        email: string;
      };
      reportsTo: (Employee & {
        user: {
          id: string;
          name: string;
        };
      }) | null;
    })[];
  }) | null;
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
  });

  return commissions;
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
  return format(d, 'PPP');
}

export default async function EmployeePage({ params }: PageProps) {
  const employee = await getEmployee(params.id);
  const commissions = await getEmployeeCommissions(params.id);

  const totalCommission = commissions.reduce((sum, commission) => 
    sum + parseFloat(commission.amount.toString()), 0
  );

  // Pre-format dates to avoid date manipulation in JSX
  const formattedDates = {
    dateOfBirth: formatDate(employee.dateOfBirth),
    dateOfJoining: formatDate(employee.dateOfJoining),
  };

  return (
    <div className="space-y-8 pt-4 pb-8">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <p className="font-medium">{formattedDates.dateOfBirth}</p>
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
                <p className="font-medium">{formattedDates.dateOfJoining}</p>
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
                    className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors"
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
                  <div className="p-4 bg-muted/50 rounded-lg">
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
                        className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors"
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
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">No direct reports</p>
                  </div>
                )}
              </div>

              {/* Team Structure Section */}
              {(employee.memberOfTeam || employee.leadsTeam) && (
                <div>
                  <h3 className="text-sm font-medium mb-4">Team Structure</h3>
                  <div className="space-y-4">
                    {employee.leadsTeam ? (
                      <>
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <p className="font-medium text-sm text-muted-foreground mb-2">Team Leader</p>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-primary/10">
                                {employee.user.name.split(' ').map((n: string) => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{employee.user.name}</p>
                              <Badge className={`mt-1 ${getRoleBadgeClass(employee.employeeRole)}`}>
                                {formatRole(employee.employeeRole)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="pl-6 border-l-2 border-muted space-y-4">
                          {employee.leadsTeam.members
                            // Only filter out the current employee if they're the team leader (to avoid duplication)
                            .filter(member => member.id !== employee.id)
                            // Make sure we don't show duplicates
                            .filter((member, index, self) => 
                              index === self.findIndex(m => m.id === member.id)
                            )
                            .map((member, index) => (
                              <Link
                                key={`team-lead-member-${member.id}-${index}`}
                                href={`/admin/employees/${member.id}`}
                                className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors"
                              >
                                <Avatar className="h-10 w-10">
                                  <AvatarFallback className="bg-primary/10">
                                    {member.user.name.split(' ').map((n: string) => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{member.user.name}</p>
                                  <Badge className={`mt-1 ${getRoleBadgeClass(member.employeeRole)}`}>
                                    {formatRole(member.employeeRole)}
                                  </Badge>
                                  {'reportsTo' in member && member.reportsTo && 'user' in member.reportsTo && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      Reports to: {member.reportsTo.user.name}
                                    </p>
                                  )}
                                </div>
                              </Link>
                          ))}
                        </div>
                      </>
                    ) : employee.memberOfTeam && (
                      <>
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <p className="font-medium text-sm text-muted-foreground mb-2">Team Leader</p>
                          <Link
                            href={`/admin/employees/${employee.memberOfTeam.leader.id}`}
                            className="flex items-center gap-3"
                          >
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-primary/10">
                                {employee.memberOfTeam.leader.user.name.split(' ').map((n: string) => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{employee.memberOfTeam.leader.user.name}</p>
                              <Badge className={`mt-1 ${getRoleBadgeClass(employee.memberOfTeam.leader.employeeRole)}`}>
                                {formatRole(employee.memberOfTeam.leader.employeeRole)}
                              </Badge>
                            </div>
                          </Link>
                        </div>
                        <div className="pl-6 border-l-2 border-muted space-y-4">
                          {employee.memberOfTeam.members
                            // Only filter out the team leader to avoid duplication
                            .filter(member => member.id !== employee.memberOfTeam?.leader.id)
                            // Make sure we don't show duplicates
                            .filter((member, index, self) => 
                              index === self.findIndex(m => m.id === member.id)
                            )
                            .map((member, index) => (
                              <Link
                                key={`team-member-${member.id}-${index}`}
                                href={`/admin/employees/${member.id}`}
                                className={`flex items-center gap-3 p-4 rounded-lg hover:bg-muted/70 transition-colors ${
                                  member.id === employee.id 
                                    ? 'bg-primary/10 border border-primary/20' // Highlight current employee
                                    : 'bg-muted/50'
                                }`}
                              >
                                <Avatar className="h-10 w-10">
                                  <AvatarFallback className={member.id === employee.id ? "bg-primary/20" : "bg-primary/10"}>
                                    {member.user.name.split(' ').map((n: string) => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">
                                    {member.user.name}
                                    {member.id === employee.id && <span className="ml-2 text-sm text-primary font-normal">(You)</span>}
                                  </p>
                                  <Badge className={`mt-1 ${getRoleBadgeClass(member.employeeRole)}`}>
                                    {formatRole(member.employeeRole)}
                                  </Badge>
                                </div>
                              </Link>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sold Plots Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Sold Plots</CardTitle>
            </div>
            {commissions.length > 0 && (
              <div className="flex items-center gap-12">
                <div>
                  <p className="text-sm text-muted-foreground">Total Sales</p>
                  <p className="text-xl font-bold">{commissions.length} plots</p>
                </div>
                <div className="border-l pl-12">
                  <p className="text-sm text-muted-foreground">Total Commission</p>
                  <p className="text-xl font-bold text-green-600">₹{totalCommission.toLocaleString()}</p>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {commissions.length > 0 ? (
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_1fr_1fr_1fr_40px] gap-6 border-b">
                <div className="pb-2 text-sm font-medium text-muted-foreground">Plot Number</div>
                <div className="pb-2 text-sm font-medium text-muted-foreground text-center">Commission Amount</div>
                <div className="pb-2 text-sm font-medium text-muted-foreground text-center">Commission Rate</div>
                <div className="pb-2 text-sm font-medium text-muted-foreground">Sale Date</div>
                <div className="pb-2"></div>
              </div>

              {commissions.map(commission => (
                <Collapsible key={commission.id}>
                  <div className="grid grid-cols-[1fr_1fr_1fr_1fr_40px] gap-6 items-center py-3 group">
                    <div className="font-medium">{commission.soldPlot.plotNumber}</div>
                    <div className="text-center text-green-600 font-medium">₹{parseFloat(commission.amount.toString()).toLocaleString()}</div>
                    <div className="text-center font-medium">{(parseFloat(commission.percentage.toString()) * 100).toFixed(1)}%</div>
                    <div className="font-medium">{formatDate(commission.soldPlot.soldAt)}</div>
                    <div className="flex justify-end">
                      <CollapsibleTrigger className="h-6 w-6 p-1 hover:bg-muted rounded">
                        <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                      </CollapsibleTrigger>
                    </div>
                  </div>
                  <CollapsibleContent>
                    <div className="border-t bg-muted/50 py-4">
                      <div className="px-6">
                        <div className="grid grid-cols-2 gap-8">
                          {/* Plot Details */}
                          <div>
                            <h4 className="font-semibold mb-4 flex items-center gap-2 text-sm">
                              <LayoutGrid className="h-4 w-4 text-muted-foreground" />
                              Plot Details
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-muted-foreground">Size</p>
                                <p className="font-medium">{commission.soldPlot.size} sq ft</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Price</p>
                                <p className="font-medium">₹{parseFloat(commission.soldPlot.price).toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Dimensions</p>
                                <p className="font-medium">{commission.soldPlot.dimensions}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Facing</p>
                                <p className="font-medium">{commission.soldPlot.facing}</p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-sm text-muted-foreground">Address</p>
                                <p className="font-medium">{commission.soldPlot.plotAddress}</p>
                              </div>
                            </div>
                          </div>

                          {/* Customer Details */}
                          <div>
                            <h4 className="font-semibold mb-4 flex items-center gap-2 text-sm">
                              <UserCheck className="h-4 w-4 text-muted-foreground" />
                              Customer Details
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-muted-foreground">Name</p>
                                <p className="font-medium">{commission.soldPlot.customerName}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Phone</p>
                                <p className="font-medium">{commission.soldPlot.phoneNumber}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Email</p>
                                <p className="font-medium">{commission.soldPlot.email}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Aadhaar</p>
                                <p className="font-medium">{commission.soldPlot.aadhaarNumber}</p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-sm text-muted-foreground">Address</p>
                                <p className="font-medium">{commission.soldPlot.address}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          ) : (
            <div className="py-12">
              <div className="flex flex-col items-center justify-center text-center">
                <BadgeIndianRupee className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-medium">No Sold Plots</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  This employee hasn't sold any plots yet. Commissions will appear here once they make their first sale.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 