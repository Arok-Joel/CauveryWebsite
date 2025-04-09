import { Resend } from 'resend';
import { generatePDFForEmail } from './pdf-generator';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType: string;
  }>;
}

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({ to, subject, html, attachments }: EmailOptions) {
  try {
    const result = await resend.emails.send({
      from: 'Royal Cauvery Farms <no-reply@royalcauveryfarms.com>',
      to,
      subject,
      html,
      attachments,
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
}

// Helper function for plot booking confirmation email
export async function sendPlotBookingConfirmationEmail({
  to,
  customerName,
  plotNumber,
  size,
  price,
  dimensions,
  facing,
  plotAddress,
  phoneNumber,
  email,
  address,
  aadhaarNumber,
  employeeId,
  employeeName,
  employeeRole,
}: {
  to: string;
  customerName: string;
  plotNumber: string;
  size: string;
  price: number;
  dimensions: string;
  facing: string;
  plotAddress: string;
  phoneNumber: string;
  email: string;
  address: string;
  aadhaarNumber: string;
  employeeId?: string;
  employeeName?: string;
  employeeRole?: string;
}) {
  try {
    // Generate PDF receipt as base64 string
    const pdfBase64 = generatePDFForEmail({
      plotNumber,
      customerName,
      size,
      price,
      dimensions,
      facing,
      plotAddress,
      phoneNumber,
      email,
      address,
      aadhaarNumber,
      employeeId,
      employeeName,
      employeeRole,
    });

    const subject = 'Plot Booking Confirmation - Royal Cauvery Farms';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="background-color: #3C5A3E; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Royal Cauvery Farms</h1>
        </div>
        
        <div style="padding: 20px;">
          <h2 style="color: #3C5A3E; border-bottom: 2px solid #3C5A3E; padding-bottom: 10px;">Plot Booking Confirmation</h2>
          <p>Dear ${customerName},</p>
          <p>Thank you for booking a plot with Royal Cauvery Farms.</p>
          <p>Please find your booking receipt attached to this email.</p>
          <p>Our team will contact you shortly to complete the formalities.</p>
          <p>Best regards,<br>Royal Cauvery Farms Team</p>
        </div>
        
        <div style="background-color: #3C5A3E; color: white; padding: 15px; text-align: center; font-size: 12px;">
          <p>© ${new Date().getFullYear()} Royal Cauvery Farms. All rights reserved.</p>
        </div>
      </div>
    `;

    return sendEmail({
      to,
      subject,
      html,
      attachments: [
        {
          filename: `booking-confirmation-${plotNumber}.pdf`,
          content: pdfBase64,
          contentType: 'application/pdf',
        },
      ],
    });
  } catch (error) {
    console.error('Error sending plot booking confirmation email:', error);
    throw error;
  }
}

// Add employee welcome email function
export async function sendEmployeeWelcomeEmail({
  to,
  employeeName,
  employeeId,
}: {
  to: string;
  employeeName: string;
  employeeId: string;
}) {
  const subject = 'Welcome to Royal Cauvery Farms';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="background-color: #3C5A3E; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Royal Cauvery Farms</h1>
      </div>
      
      <div style="padding: 20px;">
        <h2 style="color: #3C5A3E; border-bottom: 2px solid #3C5A3E; padding-bottom: 10px;">Welcome to Royal Cauvery Farms!</h2>
        <p>Dear ${employeeName},</p>
        <p>Welcome to the Royal Cauvery Farms family! We're excited to have you on board.</p>
        <p>Here is your employee ID for future reference:</p>
        
        <div style="background-color: #3C5A3E; color: white; padding: 15px; text-align: center; margin: 20px 0; border-radius: 5px;">
          <h2 style="margin: 0; font-size: 24px;">${employeeId}</h2>
        </div>
        
        <p><strong>Important:</strong> You'll need this ID to log in to your employee dashboard. Please keep it safe.</p>
        
        <p>To access your dashboard:</p>
        <ol>
          <li>Visit our employee portal</li>
          <li>Enter your employee ID: ${employeeId}</li>
          <li>Enter your password</li>
        </ol>
        
        <p>Best regards,<br>Royal Cauvery Farms Team</p>
      </div>
      
      <div style="background-color: #3C5A3E; color: white; padding: 15px; text-align: center; font-size: 12px;">
        <p>© ${new Date().getFullYear()} Royal Cauvery Farms. All rights reserved.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to,
    subject,
    html,
  });
}
