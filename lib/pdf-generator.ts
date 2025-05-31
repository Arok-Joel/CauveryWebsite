import jsPDF from 'jspdf';
import autoTable, { RowInput } from 'jspdf-autotable';

interface BookingDetails {
  plotNumber: string;
  customerName: string;
  price: string;
  size: string;
  date: string;
  phoneNumber: string;
  email: string;
  employeeId: string;
  employeeName: string;
  employeeRole: string;
}

interface TablePosition {
  finalY: number;
}

// Generate PDF for download
export const generatePDF = async (details: BookingDetails) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  let yPos = 15;
  
  // Add company header
  doc.setFontSize(18);
  doc.setTextColor(0, 100, 0); // Dark green color
  doc.text('Nilam', pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;
  
  // Add receipt title
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Plot Booking Receipt', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  // Add receipt number and date
  doc.setFontSize(9);
  doc.text(`Receipt No: RCF-${details.plotNumber}-${Date.now().toString().slice(-4)}`, 15, yPos);
  doc.text(`Date: ${details.date}`, pageWidth - 15, yPos, { align: 'right' });
  yPos += 4;

  // Add separator line
  doc.setDrawColor(0, 100, 0);
  doc.setLineWidth(0.3);
  doc.line(15, yPos, pageWidth - 15, yPos);
  yPos += 10;

  // Customer Details Section
  doc.setFontSize(11);
  doc.setTextColor(0, 100, 0);
  doc.text('Customer Details', 15, yPos);
  yPos += 5;

  // Customer Details Table
  autoTable(doc, {
    startY: yPos,
    head: [],
    body: [
      ['Customer Name', details.customerName],
      ['Contact Number', details.phoneNumber],
      ['Email', details.email],
    ],
    theme: 'plain',
    styles: {
      fontSize: 9,
      cellPadding: 2,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
      1: { cellWidth: 100 }
    },
    didDrawPage: (data) => {
      yPos = data.cursor?.y ? data.cursor.y + 10 : yPos + 20;
    },
  });

  // Plot Details Section
  doc.setFontSize(11);
  doc.setTextColor(0, 100, 0);
  doc.text('Plot Details', 15, yPos);
  yPos += 5;

  // Plot Details Table
  autoTable(doc, {
    startY: yPos,
    head: [],
    body: [
      ['Plot Number', `#${details.plotNumber}`],
      ['Plot Size', `${details.size} Sq.ft`],
      ['Plot Facing', 'North'],
      ['Location', 'Nilam, Trichy'],
      ['Layout', 'Phase 1'],
      ['Plot Type', 'Residential'],
      ['Total Amount', `Rs. ${Number(details.price).toLocaleString('en-IN')}`],
    ],
    theme: 'plain',
    styles: {
      fontSize: 9,
      cellPadding: 2,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
      1: { cellWidth: 100 }
    },
    didDrawPage: (data) => {
      yPos = data.cursor?.y ? data.cursor.y + 10 : yPos + 20;
    },
  });

  // Employee Details Section
  doc.setFontSize(11);
  doc.setTextColor(0, 100, 0);
  doc.text('Employee Details', 15, yPos);
  yPos += 5;

  // Employee Details Table
  autoTable(doc, {
    startY: yPos,
    head: [],
    body: [
      ['Employee ID', details.employeeId],
      ['Employee Name', details.employeeName],
      ['Role', details.employeeRole],
    ],
    theme: 'plain',
    styles: {
      fontSize: 9,
      cellPadding: 2,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
      1: { cellWidth: 100 }
    },
    didDrawPage: (data) => {
      yPos = data.cursor?.y ? data.cursor.y + 10 : yPos + 20;
    },
  });

  // Terms and Conditions
  doc.setFontSize(8);
  doc.setTextColor(64, 64, 64);
  doc.text('Terms & Conditions:', 15, yPos);
  yPos += 4;
  doc.text('1. This receipt confirms your plot booking at Nilam.', 15, yPos);
  yPos += 3;
  doc.text('2. Plot allocation is subject to documentation verification.', 15, yPos);
  yPos += 3;
  doc.text('3. Please contact our support team for any assistance.', 15, yPos);

  // Footer with contact information
  const footerY = doc.internal.pageSize.height - 10;
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text('Nilam | Email: sales@nilam.com | Support: +91-80-XXXX-XXXX', pageWidth / 2, footerY, { align: 'center' });

  // Save the PDF
  doc.save(`booking-confirmation-${details.plotNumber}.pdf`);
};

// Generate PDF for email attachment (returns base64 string)
export const generatePDFForEmail = (details: {
  plotNumber: string;
  customerName: string;
  price: number | string;
  size: string;
  dimensions?: string;
  facing?: string;
  plotAddress?: string;
  phoneNumber: string;
  email: string;
  address?: string;
  aadhaarNumber?: string;
  employeeId?: string;
  employeeName?: string;
  employeeRole?: string;
}): string => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  let yPos = 15;
  
  // Add company header
  doc.setFontSize(18);
  doc.setTextColor(0, 100, 0); // Dark green color
  doc.text('Nilam', pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;
  
  // Add receipt title
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Plot Booking Receipt', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  // Add receipt number and date
  const date = new Date().toLocaleDateString();
  doc.setFontSize(9);
  doc.text(`Receipt No: RCF-${details.plotNumber}-${Date.now().toString().slice(-4)}`, 15, yPos);
  doc.text(`Date: ${date}`, pageWidth - 15, yPos, { align: 'right' });
  yPos += 4;

  // Add separator line
  doc.setDrawColor(0, 100, 0);
  doc.setLineWidth(0.3);
  doc.line(15, yPos, pageWidth - 15, yPos);
  yPos += 10;

  // Customer Details Section
  doc.setFontSize(11);
  doc.setTextColor(0, 100, 0);
  doc.text('Customer Details', 15, yPos);
  yPos += 5;

  // Customer Details Table
  const customerDetails = [
    ['Customer Name', details.customerName],
    ['Contact Number', details.phoneNumber],
    ['Email', details.email],
  ];
  
  if (details.address) {
    customerDetails.push(['Address', details.address]);
  }
  
  if (details.aadhaarNumber) {
    customerDetails.push(['Aadhaar Number', details.aadhaarNumber]);
  }

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: customerDetails,
    theme: 'plain',
    styles: {
      fontSize: 9,
      cellPadding: 2,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
      1: { cellWidth: 100 }
    },
    didDrawPage: (data) => {
      yPos = data.cursor?.y ? data.cursor.y + 10 : yPos + 20;
    },
  });

  // Plot Details Section
  doc.setFontSize(11);
  doc.setTextColor(0, 100, 0);
  doc.text('Plot Details', 15, yPos);
  yPos += 5;

  // Plot Details Table
  const plotDetails = [
    ['Plot Number', `#${details.plotNumber}`],
    ['Plot Size', `${details.size} Sq.ft`],
  ];
  
  if (details.dimensions) {
    plotDetails.push(['Plot Dimensions', details.dimensions]);
  }
  
  if (details.facing) {
    plotDetails.push(['Plot Facing', details.facing]);
  }
  
  if (details.plotAddress) {
    plotDetails.push(['Plot Address', details.plotAddress]);
  } else {
    plotDetails.push(['Location', 'Nilam, Trichy']);
    plotDetails.push(['Layout', 'Phase 1']);
    plotDetails.push(['Plot Type', 'Residential']);
  }
  
  const priceString = typeof details.price === 'number' 
    ? `Rs. ${details.price.toLocaleString('en-IN')}` 
    : `Rs. ${Number(details.price).toLocaleString('en-IN')}`;
  
  plotDetails.push(['Total Amount', priceString]);

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: plotDetails,
    theme: 'plain',
    styles: {
      fontSize: 9,
      cellPadding: 2,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
      1: { cellWidth: 100 }
    },
    didDrawPage: (data) => {
      yPos = data.cursor?.y ? data.cursor.y + 10 : yPos + 20;
    },
  });

  // Employee Details Section (if employee details are available)
  if (details.employeeId && details.employeeName) {
    doc.setFontSize(11);
    doc.setTextColor(0, 100, 0);
    doc.text('Employee Details', 15, yPos);
    yPos += 5;

    // Employee Details Table
    autoTable(doc, {
      startY: yPos,
      head: [],
      body: [
        ['Employee ID', details.employeeId],
        ['Employee Name', details.employeeName],
        ['Role', details.employeeRole || 'Sales Executive'],
      ],
      theme: 'plain',
      styles: {
        fontSize: 9,
        cellPadding: 2,
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60 },
        1: { cellWidth: 100 }
      },
      didDrawPage: (data) => {
        yPos = data.cursor?.y ? data.cursor.y + 10 : yPos + 20;
      },
    });
  }

  // Terms and Conditions
  doc.setFontSize(8);
  doc.setTextColor(64, 64, 64);
  doc.text('Terms & Conditions:', 15, yPos);
  yPos += 4;
  doc.text('1. This receipt confirms your plot booking at Nilam.', 15, yPos);
  yPos += 3;
  doc.text('2. Plot allocation is subject to documentation verification.', 15, yPos);
  yPos += 3;
  doc.text('3. Please contact our support team for any assistance.', 15, yPos);

  // Footer with contact information
  const footerY = doc.internal.pageSize.height - 10;
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text('Nilam | Email: sales@nilam.com | Support: +91-80-XXXX-XXXX', pageWidth / 2, footerY, { align: 'center' });

  // Return the PDF as base64 string
  return doc.output('datauristring').split(',')[1];
}; 