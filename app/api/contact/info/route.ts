import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { EmployeeRole } from '@prisma/client';
import { ROLE_HIERARCHY_LEVELS } from '@/lib/employee-roles';

// In-memory cache
let cachedContactInfo: any = null;
let cacheExpiration: number = 0;
const CACHE_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// GET - Retrieve admin contact information for public display
export async function GET() {
  try {
    // Clear cache on every request to ensure latest data is always shown
    // This fixes the issue with employee role changes not being reflected
    cachedContactInfo = null;
    
    // Check if required models exist
    const modelNames = Object.keys(db).filter(key => 
      !['$on', '$connect', '$disconnect', '$use', '$transaction', '$extends'].includes(key)
    );
    
    const hasAdminContactInfo = modelNames.includes('adminContactInfo');
    const hasPhoneNumber = modelNames.includes('phoneNumber');
    
    if (!hasAdminContactInfo || !hasPhoneNumber) {
      console.error('Missing required models for contact info:', { hasAdminContactInfo, hasPhoneNumber });
      // Return empty data if models don't exist
      return NextResponse.json({ 
        id: '',
        address: '',
        email: '',
        phoneNumbers: [],
        topEmployeePhone: '',
        topEmployeeName: '',
        topEmployeeRole: ''
      });
    }
    
    // Get the first admin contact info (fast query)
    const adminContactInfo = await db.adminContactInfo.findFirst({
      include: {
        phoneNumbers: true,
      },
    });

    // Get highest-ranking employee's phone number (optimized query)
    let topEmployeePhone = '';
    let topEmployeeName = '';
    let topEmployeeRole = '';
    try {
      // Modified query to select the highest ranking employee (lowest hierarchyLevel)
      // With a tiebreaker of most sold plots for employees with the same role
      const topEmployees = await db.$queryRaw`
        SELECT 
          e."employeeRole", 
          u."name",
          u."phone",
          COUNT(c."id") as "soldPlots"
        FROM "Employee" e
        JOIN "User" u ON e."userId" = u."id"
        LEFT JOIN "Commission" c ON e."id" = c."employeeId"
        WHERE e."isTerminated" = false
        GROUP BY e."employeeRole", e."hierarchyLevel", u."name", u."phone", e."id"
        ORDER BY e."hierarchyLevel" ASC, COUNT(c."id") DESC
        LIMIT 1
      `;
      
      if (Array.isArray(topEmployees) && topEmployees.length > 0) {
        topEmployeePhone = topEmployees[0].phone;
        topEmployeeName = topEmployees[0].name;
        topEmployeeRole = topEmployees[0].employeeRole;
      }
    } catch (error) {
      console.error('Error fetching top employee phone:', error);
    }

    if (!adminContactInfo) {
      // Return empty structure when no data is found
      console.log('No admin contact info found, returning empty data');
      const emptyResponse = { 
        id: '',
        address: '',
        email: '',
        phoneNumbers: [],
        topEmployeePhone,
        topEmployeeName,
        topEmployeeRole
      };
      
      return NextResponse.json(emptyResponse);
    }

    // Prepare the response
    const response = {
      ...adminContactInfo,
      topEmployeePhone,
      topEmployeeName,
      topEmployeeRole
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching admin contact info:', error);
    
    // Handle Prisma errors specifically
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === 'P2001' || error.code === 'P2021') {
        console.error('Database schema error in contact info API:', error.message);
      }
    }
    
    // Return empty data in case of any error
    return NextResponse.json({ 
      id: '',
      address: '',
      email: '',
      phoneNumbers: [],
      topEmployeePhone: '',
      topEmployeeName: '',
      topEmployeeRole: ''
    });
  }
} 