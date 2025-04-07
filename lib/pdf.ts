import { format } from 'date-fns';

interface PlotBookingReceiptData {
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
  bookingDate?: Date;
}

export function generatePlotBookingReceiptHtml(data: PlotBookingReceiptData): string {
  const bookingDate = data.bookingDate || new Date();
  const formattedDate = format(bookingDate, 'dd/MM/yyyy');
  
  // Create the HTML for the receipt
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Plot Booking Receipt</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          color: #333;
          line-height: 1.4;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #3C5A3E;
          color: white;
          padding: 20px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
        }
        .content {
          padding: 20px;
        }
        h2 {
          color: #3C5A3E;
          border-bottom: 2px solid #3C5A3E;
          padding-bottom: 10px;
        }
        .receipt {
          background-color: #f9f9f9;
          border: 1px solid #ddd;
          border-radius: 5px;
          padding: 20px;
          margin: 20px 0;
        }
        .receipt h3 {
          color: #3C5A3E;
          margin-top: 0;
        }
        .details {
          margin: 20px 0;
          border-top: 1px solid #ddd;
          border-bottom: 1px solid #ddd;
          padding: 15px 0;
        }
        .details h4 {
          color: #3C5A3E;
          margin-top: 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        td {
          padding: 5px 0;
        }
        .terms {
          margin-top: 20px;
          font-size: 12px;
          color: #666;
        }
        .terms h4 {
          color: #3C5A3E;
          margin-top: 0;
        }
        .terms ol {
          padding-left: 20px;
        }
        .footer {
          background-color: #3C5A3E;
          color: white;
          padding: 15px;
          text-align: center;
          font-size: 12px;
        }
        .footer p {
          margin: 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Royal Cauvery Farms</h1>
        </div>
        
        <div class="content">
          <h2>Plot Booking Receipt</h2>
          
          <div class="receipt">
            <h3>Receipt</h3>
            <p><strong>Date:</strong> ${formattedDate}</p>
            
            <div class="details">
              <h4>Customer Details</h4>
              <table>
                <tr>
                  <td width="30%"><strong>Name:</strong></td>
                  <td>${data.customerName}</td>
                </tr>
                <tr>
                  <td><strong>Phone:</strong></td>
                  <td>${data.phoneNumber}</td>
                </tr>
                <tr>
                  <td><strong>Email:</strong></td>
                  <td>${data.email}</td>
                </tr>
                <tr>
                  <td><strong>Address:</strong></td>
                  <td>${data.address}</td>
                </tr>
                <tr>
                  <td><strong>Aadhaar Number:</strong></td>
                  <td>${data.aadhaarNumber}</td>
                </tr>
              </table>
            </div>
            
            <div class="details">
              <h4>Plot Details</h4>
              <table>
                <tr>
                  <td width="30%"><strong>Plot Number:</strong></td>
                  <td>${data.plotNumber}</td>
                </tr>
                <tr>
                  <td><strong>Size:</strong></td>
                  <td>${data.size}</td>
                </tr>
                <tr>
                  <td><strong>Dimensions:</strong></td>
                  <td>${data.dimensions}</td>
                </tr>
                <tr>
                  <td><strong>Facing:</strong></td>
                  <td>${data.facing}</td>
                </tr>
                <tr>
                  <td><strong>Address:</strong></td>
                  <td>${data.plotAddress}</td>
                </tr>
                <tr>
                  <td><strong>Price:</strong></td>
                  <td>₹${data.price.toLocaleString('en-IN')}</td>
                </tr>
              </table>
            </div>
            
            <div class="terms">
              <h4>Terms and Conditions:</h4>
              <ol>
                <li>This is a booking confirmation receipt only.</li>
                <li>Final sale deed will be executed after complete payment.</li>
                <li>This receipt is subject to the terms and conditions of the sale agreement.</li>
                <li>All payments should be made in favor of "Royal Cauvery Farms" only.</li>
              </ol>
            </div>
          </div>
        </div>
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} Royal Cauvery Farms. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
} 