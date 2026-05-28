// ============================================================
// Professional PDF Salary Slip Generator — PDFKit
// Supports: password protection, logo embedding, QR codes
// ============================================================

import PDFDocument from 'pdfkit';
import type { Employee, SalaryRecord } from '@/types';
import { formatCurrencyForPdf, getMonthName } from '@/utils/salary';
import * as fs from 'fs';
import * as path from 'path';
import QRCode from 'qrcode';

interface GeneratePdfParams {
  employee: Employee;
  salaryRecord: SalaryRecord;
  companyName?: string;
  withPassword?: boolean;
}

/**
 * Collect a PDFKit stream into a Buffer
 */
function streamToBuffer(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
}

/**
 * Resolve the absolute path to the logo
 */
function getLogoPath(): string | null {
  // Try multiple possible locations and extensions
  const extensions = ['logo.jpg', 'logo.png', 'logo.jpeg'];
  for (const filename of extensions) {
    const candidates = [
      path.join(process.cwd(), 'public', filename),
      path.resolve('public', filename),
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) return p;
    }
  }
  return null;
}

/**
 * Generate a professional salary slip PDF with password protection
 */
export async function generateSalarySlipPdf({
  employee,
  salaryRecord,
  companyName = 'PayrollFlow',
  withPassword = true,
}: GeneratePdfParams): Promise<Uint8Array> {
  // Build password
  const firstName = (employee.name || '').split(' ')[0]?.toLowerCase() || '';
  let birthYear = '';
  if (employee.date_of_birth) {
    const parts = String(employee.date_of_birth).split(/[-/]/);
    birthYear = parts.find(p => p.length === 4) || parts[parts.length - 1] || '';
  }
  const password = birthYear ? `${firstName}${birthYear}` : employee.employee_id;

  // Create PDF with password protection
  const docOptions: PDFKit.PDFDocumentOptions = {
    size: 'A4',
    margins: { top: 50, bottom: 40, left: 50, right: 50 },
    info: {
      Title: `Salary Slip - ${employee.name} - ${getMonthName(salaryRecord.month)} ${salaryRecord.year}`,
      Author: companyName,
      Subject: 'Salary Slip',
      Creator: 'PayrollFlow',
    },
  };

  if (withPassword) {
    docOptions.userPassword = password;
    docOptions.ownerPassword = 'payrollflow_admin_2026';
    docOptions.permissions = {
      printing: 'highResolution',
      modifying: false,
      copying: false,
      annotating: false,
      fillingForms: false,
      contentAccessibility: true,
      documentAssembly: false,
    };
  }

  const doc = new PDFDocument(docOptions);
  const bufferPromise = streamToBuffer(doc);

  const pageWidth = 595.28;
  const margin = 50;
  const contentWidth = pageWidth - 2 * margin;

  // ============================================================
  // HEADER — Blue banner with logo
  // ============================================================
  doc.rect(0, 0, pageWidth, 90).fill('#1e4ec4');
  doc.rect(0, 70, pageWidth, 20).fill('#0f2c69'); // Dark bottom strip

  // Logo
  const logoPath = getLogoPath();
  if (logoPath) {
    try {
      doc.image(logoPath, margin, 18, { height: 40 });
    } catch (e) {
      console.warn('Logo embed failed:', e);
    }
  }

  // Company name — position after logo
  const nameX = logoPath ? margin + 50 : margin;
  doc.fontSize(22).font('Helvetica-Bold').fillColor('#ffffff')
    .text(companyName.toUpperCase(), nameX, 22, { lineBreak: false });

  // Subtitle
  doc.fontSize(10).font('Helvetica').fillColor('#c4d4f5')
    .text('SALARY SLIP', nameX, 48, { lineBreak: false });

  // Month/Year right side
  const monthName = getMonthName(salaryRecord.month);
  const monthYear = `${monthName} ${salaryRecord.year}`;
  doc.fontSize(14).font('Helvetica-Bold').fillColor('#ffffff')
    .text(monthYear, margin, 25, { width: contentWidth, align: 'right' });

  // Generated date
  const genDate = `Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`;
  doc.fontSize(8).font('Helvetica').fillColor('#c4d4f5')
    .text(genDate, margin, 48, { width: contentWidth, align: 'right' });

  // ============================================================
  // EMPLOYEE DETAILS — Card
  // ============================================================
  const detailsY = 110;

  // Card background
  doc.roundedRect(margin, detailsY, contentWidth, 85, 4)
    .fillAndStroke('#f5f7fb', '#e2e5ed');

  // Section title
  doc.fontSize(9).font('Helvetica-Bold').fillColor('#1e4ec4')
    .text('EMPLOYEE DETAILS', margin + 15, detailsY + 10);

  // Details grid
  const col1 = margin + 15;
  const col1Val = margin + 115;
  const col2 = pageWidth / 2 + 15;
  const col2Val = pageWidth / 2 + 115;
  const lineH = 18;
  let dy = detailsY + 28;

  const drawField = (label: string, value: string, lx: number, vx: number, fy: number) => {
    doc.fontSize(8).font('Helvetica').fillColor('#72788a').text(label, lx, fy, { lineBreak: false });
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#1a1a1a').text(value || 'N/A', vx, fy, { lineBreak: false });
  };

  drawField('Employee ID', employee.employee_id, col1, col1Val, dy);
  drawField('Department', employee.department || 'N/A', col2, col2Val, dy);
  dy += lineH;
  drawField('Employee Name', employee.name, col1, col1Val, dy);
  drawField('Designation', employee.designation || 'N/A', col2, col2Val, dy);
  dy += lineH;
  drawField('Email', employee.email, col1, col1Val, dy);
  drawField('Pay Period', monthYear, col2, col2Val, dy);

  // ============================================================
  // SALARY BREAKDOWN TABLE
  // ============================================================
  const tableY = detailsY + 105;

  doc.fontSize(9).font('Helvetica-Bold').fillColor('#1e4ec4')
    .text('SALARY BREAKDOWN', margin, tableY);

  doc.moveTo(margin, tableY + 14).lineTo(margin + contentWidth, tableY + 14)
    .strokeColor('#1e4ec4').lineWidth(1.5).stroke();

  // Safe numeric values
  const baseSalary = Number(salaryRecord.base_salary) || 0;
  const hra = Number(salaryRecord.hra) || 0;
  const allowances = Number(salaryRecord.allowances) || 0;
  const deductions = Number(salaryRecord.deductions) || 0;
  const netSalary = Number(salaryRecord.net_salary) || 0;
  const totalEarnings = baseSalary + hra + allowances;

  // Table header
  const thY = tableY + 18;
  const rowH = 30;
  doc.rect(margin, thY, contentWidth, rowH).fill('#1e4ec4');
  doc.fontSize(9).font('Helvetica-Bold').fillColor('#ffffff')
    .text('Component', margin + 15, thY + 10, { lineBreak: false });
  doc.fontSize(9).font('Helvetica-Bold').fillColor('#ffffff')
    .text('Amount (INR)', margin + contentWidth - 120, thY + 10, { width: 105, align: 'right' });

  // Table rows
  const rows = [
    { label: 'Basic Salary', amount: baseSalary, isTotal: false, isDeduction: false },
    { label: 'House Rent Allowance (HRA)', amount: hra, isTotal: false, isDeduction: false },
    { label: 'Other Allowances', amount: allowances, isTotal: false, isDeduction: false },
    { label: 'Total Earnings', amount: totalEarnings, isTotal: true, isDeduction: false },
    { label: 'Deductions', amount: deductions, isTotal: false, isDeduction: true },
  ];

  let ry = thY + rowH;
  rows.forEach((row, i) => {
    // Row background
    if (row.isTotal) {
      doc.rect(margin, ry, contentWidth, rowH).fill('#e8edf8');
    } else if (i % 2 === 0) {
      doc.rect(margin, ry, contentWidth, rowH).fill('#f5f7fb');
    } else {
      doc.rect(margin, ry, contentWidth, rowH).fill('#ffffff');
    }

    // Row border
    doc.moveTo(margin, ry + rowH).lineTo(margin + contentWidth, ry + rowH)
      .strokeColor('#e2e5ed').lineWidth(0.5).stroke();

    // Label
    const font = row.isTotal ? 'Helvetica-Bold' : 'Helvetica';
    const labelColor = row.isTotal ? '#1e4ec4' : '#1a1a1a';
    doc.fontSize(9).font(font).fillColor(labelColor)
      .text(row.label, margin + 15, ry + 10, { lineBreak: false });

    // Amount
    const amountColor = row.isDeduction ? '#cc2626' : labelColor;
    doc.fontSize(9).font(font).fillColor(amountColor)
      .text(formatCurrencyForPdf(row.amount), margin + contentWidth - 120, ry + 10, { width: 105, align: 'right' });

    ry += rowH;
  });

  // ============================================================
  // NET SALARY — Big green box
  // ============================================================
  const netH = 44;
  doc.rect(margin, ry, contentWidth, netH).fill('#16874f');

  doc.fontSize(14).font('Helvetica-Bold').fillColor('#ffffff')
    .text('NET SALARY', margin + 15, ry + 15, { lineBreak: false });

  doc.fontSize(16).font('Helvetica-Bold').fillColor('#ffffff')
    .text(formatCurrencyForPdf(netSalary), margin + contentWidth - 160, ry + 14, { width: 145, align: 'right' });

  ry += netH;

  // ============================================================
  // SIGNATURE — Tight
  // ============================================================
  const sigY = ry + 30;
  doc.moveTo(pageWidth - margin - 160, sigY).lineTo(pageWidth - margin, sigY)
    .strokeColor('#1a1a1a').lineWidth(0.5).stroke();

  doc.fontSize(8).font('Helvetica').fillColor('#72788a')
    .text('Authorized Signatory', pageWidth - margin - 135, sigY + 5, { lineBreak: false });

  // ============================================================
  // QR CODE
  // ============================================================
  const footerY = 735;

  try {
    const qrDataUrl = await QRCode.toDataURL('https://payrollflow.vercel.app', {
      width: 200, margin: 1, color: { dark: '#1e4ec4', light: '#ffffff' },
    });
    const qrBase64 = qrDataUrl.split(',')[1];
    const qrBuffer = Buffer.from(qrBase64, 'base64');
    doc.image(qrBuffer, pageWidth - margin - 48, footerY, { width: 48, height: 48 });
    doc.fontSize(6).font('Helvetica').fillColor('#1e4ec4')
      .text('Verify Document', pageWidth - margin - 52, footerY + 50, { width: 56, align: 'center' });
  } catch (e) {
    console.warn('QR code failed:', e);
  }

  // ============================================================
  // FOOTER
  // ============================================================
  // Confidential banner
  doc.roundedRect(margin, footerY + 2, contentWidth - 65, 18, 2)
    .fillAndStroke('#f5f5f5', '#e2e5ed');

  doc.fontSize(7).font('Helvetica-Bold').fillColor('#72788a')
    .text('CONFIDENTIAL PAYROLL DOCUMENT', margin + 10, footerY + 8, { lineBreak: false });

  // Footer text
  doc.fontSize(7).font('Helvetica').fillColor('#72788a')
    .text(
      'This is a system-generated salary slip and does not require a physical signature.',
      margin, footerY + 26
    );

  doc.fontSize(7).font('Helvetica').fillColor('#72788a')
    .text(
      `Generated on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })} by ${companyName}`,
      margin, footerY + 38
    );

  // Password info
  if (withPassword) {
    doc.fontSize(7).font('Helvetica').fillColor('#72788a')
      .text(`Document Password: ${password}`, margin, footerY + 50);
  }

  // ============================================================
  // DONE
  // ============================================================
  doc.end();
  const buffer = await bufferPromise;
  return new Uint8Array(buffer);
}
