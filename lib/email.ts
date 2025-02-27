import { Resend } from 'resend';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

// For debugging
const DEBUG = process.env.NODE_ENV !== 'production';

/**
 * NOTE: In Resend's test mode, emails are only delivered to:
 * 1. The email address associated with your Resend account
 * 2. Verified email addresses you've added to your Resend account
 * 
 * To send to any recipient:
 * 1. Verify a domain in your Resend dashboard
 * 2. Update the "from" address to use your verified domain
 * 3. Switch to a paid plan
 */

interface SendEmployeeWelcomeEmailProps {
  to: string;
  employeeName: string;
  employeeId: string;
}

export async function sendEmployeeWelcomeEmail({
  to,
  employeeName,
  employeeId,
}: SendEmployeeWelcomeEmailProps) {
  if (DEBUG) {
    console.log(`Attempting to send welcome email to ${to} for employee ID ${employeeId}`);
    console.log(`Using API key: ${process.env.RESEND_API_KEY ? 'Present (not shown)' : 'Missing!'}`);
  }
  
  // In test mode, we'll store the email content and details for verification
  // This helps us confirm the email would have been sent correctly
  const emailContent = {
    to,
    employeeName,
    employeeId,
    subject: 'Welcome to Royal Cauvery Farms - Your Employee ID',
    sentAt: new Date().toISOString(),
  };
  
  try {
    const result = await resend.emails.send({
      // Use your verified domain
      from: 'Royal Cauvery Farms <no-reply@royalcauveryfarms.com>',
      to: [to],
      subject: 'Welcome to Royal Cauvery Farms - Your Employee ID',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #3C5A3E; margin-bottom: 20px;">Welcome to Royal Cauvery Farms!</h2>
          
          <p>Dear ${employeeName},</p>
          
          <p>Welcome to the Royal Cauvery Farms family! We're excited to have you on board.</p>
          
          <p>Here is your employee ID for future reference:</p>
          
          <div style="background-color: #f0f7f0; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
            <h3 style="color: #3C5A3E; font-size: 24px; margin: 0;">${employeeId}</h3>
          </div>
          
          <p><strong>Important:</strong> You'll need this ID to log in to your employee dashboard. Please keep it safe.</p>
          
          <p>To access your dashboard:</p>
          <ol>
            <li>Visit our employee portal</li>
            <li>Enter your employee ID: ${employeeId}</li>
            <li>Enter your password</li>
          </ol>
          
          <p style="margin-top: 20px;">If you have any questions or need assistance, please don't hesitate to contact HR.</p>
          
          <p style="color: #666; margin-top: 30px;">Best regards,<br>Royal Cauvery Farms Team</p>
        </div>
      `,
    });
    
    if (DEBUG) {
      console.log('Email sent successfully:', result);
    }
    
    // Store the email details in the database or log for verification
    // This is useful for non-production environments where emails might not be delivered
    await logEmailSent(emailContent);
    
    return { success: true, id: result.id, emailContent };
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    
    // In development, still log the email attempt
    if (process.env.NODE_ENV !== 'production') {
      await logEmailSent(emailContent, error instanceof Error ? error.message : 'Unknown error');
      
      // In development, we'll consider this a "success" for testing purposes
      // but we'll include a flag indicating it was simulated
      return { 
        success: true, 
        simulated: true,
        emailContent,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
    
    // Don't throw, just return error status
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Helper function to log emails (could be replaced with database storage)
async function logEmailSent(emailContent: any, error?: string) {
  // In a real app, you might store this in a database
  console.log('EMAIL LOG:', { 
    ...emailContent,
    status: error ? 'ERROR' : 'SENT',
    error,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
}
