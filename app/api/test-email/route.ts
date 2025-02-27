import { NextRequest, NextResponse } from 'next/server';
import { sendEmployeeWelcomeEmail } from '@/lib/email';

export async function GET(req: NextRequest) {
  try {
    // Get the email from the query parameter
    const searchParams = req.nextUrl.searchParams;
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }
    
    console.log(`Testing email sending to: ${email}`);
    
    const result = await sendEmployeeWelcomeEmail({
      to: email,
      employeeName: 'Test User',
      employeeId: 'RCF2025999',
    });
    
    return NextResponse.json({
      message: 'Test email sent',
      result,
    });
  } catch (error) {
    console.error('Error in test-email route:', error);
    return NextResponse.json(
      { error: 'Failed to send test email', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
