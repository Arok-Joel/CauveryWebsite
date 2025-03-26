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

export const generatePDF = async (details: BookingDetails) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  let yPos = 15;
  
  // Add company header
  doc.setFontSize(18);
  doc.setTextColor(0, 100, 0); // Dark green color
  doc.text('Royal Cauvery Farms', pageWidth / 2, yPos, { align: 'center' });
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
      ['Location', 'Royal Cauvery Farms, Bangalore'],
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
  doc.text('1. This receipt confirms your plot booking at Royal Cauvery Farms.', 15, yPos);
  yPos += 3;
  doc.text('2. Plot allocation is subject to documentation verification.', 15, yPos);
  yPos += 3;
  doc.text('3. Please contact our support team for any assistance.', 15, yPos);

  // Footer with contact information
  const footerY = doc.internal.pageSize.height - 10;
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text('Royal Cauvery Farms | Email: sales@royalcauveryfarms.com | Support: +91-80-XXXX-XXXX', pageWidth / 2, footerY, { align: 'center' });

  // Save the PDF
  doc.save(`booking-confirmation-${details.plotNumber}.pdf`);
}; 