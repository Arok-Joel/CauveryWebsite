import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET() {
  try {
    // Get auth token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized - No token' }, { status: 401 });
    }

    // Verify token
    const verified = await verifyAuth(token);

    if (!verified) {
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    // Check if user has the correct role
    if (verified.role !== 'USER') {
      return NextResponse.json({ error: 'Unauthorized - Invalid role' }, { status: 401 });
    }

    // Get user data
    const user = await db.user.findFirst({
      where: {
        email: verified.email,
        role: 'USER'
      }
    });

    console.log('Found user:', { email: user?.email, phone: user?.phone });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Format the response
    const response = {
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address || '',
        pincode: user.pincode || '',
        profileImage: user.profileImage,
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    // Get auth token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized - No token' }, { status: 401 });
    }

    // Verify token
    const verified = await verifyAuth(token);

    if (!verified) {
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    // Check if user has the correct role
    if (verified.role !== 'USER') {
      return NextResponse.json({ error: 'Unauthorized - Invalid role' }, { status: 401 });
    }

    // Get update data from request body
    const data = await request.json();
    const { name, phone, address, pincode } = data;

    // Update user profile
    const updatedUser = await db.user.update({
      where: { email: verified.email },
      data: {
        name,
        phone,
        address,
        pincode,
      },
    });

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: {
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        address: updatedUser.address || '',
        pincode: updatedUser.pincode || '',
        profileImage: updatedUser.profileImage,
      },
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update user profile" },
      { status: 500 }
    );
  }
} 