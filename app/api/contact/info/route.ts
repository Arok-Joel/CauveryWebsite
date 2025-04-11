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
    // Check cache first
    const now = Date.now();
    if (cachedContactInfo && now < cacheExpiration) {
      return NextResponse.json(cachedContactInfo);
    }
    
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
      // Instead of querying for top role first, use a single optimized query
      // This is more efficient as it avoids multiple round-trips
      const topEmployeesWithCommissions = await db.$queryRaw`
        WITH RankedEmployees AS (
          SELECT 
            e."id", 
            e."employeeRole", 
            e."hierarchyLevel",
            u."name",
            u."phone",
            COUNT(c."id") as "soldPlots",
            ROW_NUMBER() OVER (PARTITION BY e."hierarchyLevel" ORDER BY COUNT(c."id") DESC) as rank
          FROM "Employee" e
          JOIN "User" u ON e."userId" = u."id"
          LEFT JOIN "Commission" c ON e."id" = c."employeeId"
          GROUP BY e."id", e."employeeRole", e."hierarchyLevel", u."name", u."phone"
        )
        SELECT *
        FROM RankedEmployees
        WHERE rank = 1
        ORDER BY "hierarchyLevel" ASC
        LIMIT 1
      `;
      
      if (Array.isArray(topEmployeesWithCommissions) && topEmployeesWithCommissions.length > 0) {
        topEmployeePhone = topEmployeesWithCommissions[0].phone;
        topEmployeeName = topEmployeesWithCommissions[0].name;
        topEmployeeRole = topEmployeesWithCommissions[0].employeeRole;
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
      
      // Cache the empty result too
      cachedContactInfo = emptyResponse;
      cacheExpiration = now + CACHE_DURATION_MS;
      
      return NextResponse.json(emptyResponse);
    }

    // Prepare the response
    const response = {
      ...adminContactInfo,
      topEmployeePhone,
      topEmployeeName,
      topEmployeeRole
    };
    
    // Update cache
    cachedContactInfo = response;
    cacheExpiration = now + CACHE_DURATION_MS;

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