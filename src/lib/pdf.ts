// ============================================================
// Professional PDF Salary Slip Generator
// ============================================================

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { Employee, SalaryRecord } from '@/types';
import { formatCurrencyForPdf, getMonthName } from '@/utils/salary';

interface GeneratePdfParams {
  employee: Employee;
  salaryRecord: SalaryRecord;
  companyName?: string;
  withPassword?: boolean;
}

/**
 * Generate a professional salary slip PDF
 */
export async function generateSalarySlipPdf({
  employee,
  salaryRecord,
  companyName = 'PayrollFlow',
  withPassword = true,
}: GeneratePdfParams): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
  const { width, height } = page.getSize();

  // Fonts
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Colors
  const primaryColor = rgb(0.118, 0.306, 0.769);
  const darkBlue = rgb(0.059, 0.173, 0.412);
  const textColor = rgb(0.1, 0.1, 0.1);
  const mutedColor = rgb(0.45, 0.45, 0.45);
  const lineColor = rgb(0.85, 0.85, 0.85);
  const headerBgColor = rgb(0.118, 0.306, 0.769);
  const lightBgColor = rgb(0.96, 0.97, 0.99);
  const accentGreen = rgb(0.086, 0.533, 0.318);
  const white = rgb(1, 1, 1);

  const margin = 50;
  let y = height - margin;

  // ============================================================
  // HEADER - Company banner with gradient effect
  // ============================================================
  const headerHeight = 85;

  // Dark blue bottom layer
  page.drawRectangle({
    x: 0,
    y: y - headerHeight + 30,
    width: width,
    height: headerHeight,
    color: darkBlue,
  });

  // Lighter blue overlay for gradient feel
  page.drawRectangle({
    x: 0,
    y: y - headerHeight + 30 + 20,
    width: width,
    height: headerHeight - 20,
    color: headerBgColor,
  });

  // Company name
  page.drawText(companyName.toUpperCase(), {
    x: margin,
    y: y - 12,
    size: 26,
    font: fontBold,
    color: white,
  });

  // Tagline
  page.drawText('SALARY SLIP', {
    x: margin,
    y: y - 36,
    size: 11,
    font: fontRegular,
    color: rgb(0.8, 0.85, 1),
  });

  // Month/Year on right side
  const monthYear = `${getMonthName(salaryRecord.month)} ${salaryRecord.year}`;
  const monthYearWidth = fontBold.widthOfTextAtSize(monthYear, 14);
  page.drawText(monthYear, {
    x: width - margin - monthYearWidth,
    y: y - 18,
    size: 14,
    font: fontBold,
    color: white,
  });

  // Payment Date
  const payDate = `Payment Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`;
  const payDateWidth = fontRegular.widthOfTextAtSize(payDate, 9);
  page.drawText(payDate, {
    x: width - margin - payDateWidth,
    y: y - 36,
    size: 9,
    font: fontRegular,
    color: rgb(0.8, 0.85, 1),
  });

  y -= headerHeight + 30;

  // ============================================================
  // EMPLOYEE DETAILS SECTION - Card style
  // ============================================================

  // Section background
  const detailsBoxHeight = 90;
  page.drawRectangle({
    x: margin,
    y: y - detailsBoxHeight + 10,
    width: width - 2 * margin,
    height: detailsBoxHeight,
    color: lightBgColor,
    borderColor: lineColor,
    borderWidth: 0.5,
  });

  // Section title
  page.drawText('EMPLOYEE DETAILS', {
    x: margin + 15,
    y: y,
    size: 10,
    font: fontBold,
    color: primaryColor,
  });

  y -= 22;

  // Employee details - two column layout
  const col1X = margin + 15;
  const col2X = width / 2 + 20;
  const labelOffset = 105;
  const detailsLineHeight = 20;

  const drawDetail = (label: string, value: string, x: number, currentY: number) => {
    page.drawText(label, {
      x,
      y: currentY,
      size: 8,
      font: fontRegular,
      color: mutedColor,
    });
    // Safely encode value for PDF (strip non-WinAnsi characters)
    const safeValue = (value || 'N/A').replace(/[^\x20-\x7E]/g, '');
    page.drawText(safeValue, {
      x: x + labelOffset,
      y: currentY,
      size: 9,
      font: fontBold,
      color: textColor,
    });
  };

  drawDetail('Employee ID', employee.employee_id, col1X, y);
  drawDetail('Department', employee.department || 'N/A', col2X, y);
  y -= detailsLineHeight;

  drawDetail('Employee Name', employee.name, col1X, y);
  drawDetail('Designation', employee.designation || 'N/A', col2X, y);
  y -= detailsLineHeight;

  drawDetail('Email', employee.email, col1X, y);
  drawDetail('Pay Period', monthYear, col2X, y);

  y -= 40;

  // ============================================================
  // EARNINGS & DEDUCTIONS TABLE
  // ============================================================
  page.drawText('SALARY BREAKDOWN', {
    x: margin,
    y,
    size: 10,
    font: fontBold,
    color: primaryColor,
  });

  y -= 6;
  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 1.5,
    color: primaryColor,
  });

  y -= 3;

  // Table
  const tableX = margin;
  const tableWidth = width - 2 * margin;
  const rowHeight = 32;

  // Table header
  page.drawRectangle({
    x: tableX,
    y: y - rowHeight,
    width: tableWidth,
    height: rowHeight,
    color: headerBgColor,
  });

  page.drawText('Component', {
    x: tableX + 15,
    y: y - 20,
    size: 9,
    font: fontBold,
    color: white,
  });

  const amountLabel = 'Amount (INR)';
  const amountLabelWidth = fontBold.widthOfTextAtSize(amountLabel, 9);
  page.drawText(amountLabel, {
    x: tableX + tableWidth - amountLabelWidth - 15,
    y: y - 20,
    size: 9,
    font: fontBold,
    color: white,
  });

  y -= rowHeight;

  // Safely get numeric values
  const baseSalary = Number(salaryRecord.base_salary) || 0;
  const hra = Number(salaryRecord.hra) || 0;
  const allowances = Number(salaryRecord.allowances) || 0;
  const deductions = Number(salaryRecord.deductions) || 0;
  const netSalary = Number(salaryRecord.net_salary) || 0;

  // Salary rows
  const salaryItems = [
    { label: 'Basic Salary', amount: baseSalary, isEarning: true, isTotal: false },
    { label: 'House Rent Allowance (HRA)', amount: hra, isEarning: true, isTotal: false },
    { label: 'Other Allowances', amount: allowances, isEarning: true, isTotal: false },
    { label: 'Total Earnings', amount: baseSalary + hra + allowances, isEarning: true, isTotal: true },
    { label: 'Deductions', amount: deductions, isEarning: false, isTotal: false },
  ];

  salaryItems.forEach((item, index) => {
    const isAlt = index % 2 === 0;

    if (item.isTotal) {
      page.drawRectangle({
        x: tableX,
        y: y - rowHeight,
        width: tableWidth,
        height: rowHeight,
        color: rgb(0.91, 0.94, 0.99),
      });
    } else if (isAlt) {
      page.drawRectangle({
        x: tableX,
        y: y - rowHeight,
        width: tableWidth,
        height: rowHeight,
        color: lightBgColor,
      });
    }

    // Row border
    page.drawLine({
      start: { x: tableX, y: y - rowHeight },
      end: { x: tableX + tableWidth, y: y - rowHeight },
      thickness: 0.5,
      color: lineColor,
    });

    const font = item.isTotal ? fontBold : fontRegular;
    const labelColor = item.isTotal ? primaryColor : textColor;

    page.drawText(item.label, {
      x: tableX + 15,
      y: y - 20,
      size: 9,
      font,
      color: labelColor,
    });

    const amountStr = formatCurrencyForPdf(item.amount);
    const amountWidth = font.widthOfTextAtSize(amountStr, 9);
    page.drawText(amountStr, {
      x: tableX + tableWidth - amountWidth - 15,
      y: y - 20,
      size: 9,
      font,
      color: item.isEarning ? labelColor : rgb(0.8, 0.15, 0.15),
    });

    y -= rowHeight;
  });

  // ============================================================
  // NET SALARY - Big highlighted box
  // ============================================================
  const netRowHeight = 48;
  page.drawRectangle({
    x: tableX,
    y: y - netRowHeight,
    width: tableWidth,
    height: netRowHeight,
    color: accentGreen,
  });

  page.drawText('NET SALARY', {
    x: tableX + 15,
    y: y - 30,
    size: 14,
    font: fontBold,
    color: white,
  });

  const netAmountStr = formatCurrencyForPdf(netSalary);
  const netAmountWidth = fontBold.widthOfTextAtSize(netAmountStr, 16);
  page.drawText(netAmountStr, {
    x: tableX + tableWidth - netAmountWidth - 15,
    y: y - 30,
    size: 16,
    font: fontBold,
    color: white,
  });

  y -= netRowHeight + 50;

  // ============================================================
  // SIGNATURE
  // ============================================================
  page.drawLine({
    start: { x: width - margin - 180, y: y },
    end: { x: width - margin, y: y },
    thickness: 0.5,
    color: textColor,
  });

  page.drawText('Authorized Signatory', {
    x: width - margin - 145,
    y: y - 15,
    size: 9,
    font: fontRegular,
    color: mutedColor,
  });

  // ============================================================
  // FOOTER
  // ============================================================
  const footerY = margin + 50;

  // Confidential banner
  page.drawRectangle({
    x: margin,
    y: footerY + 5,
    width: width - 2 * margin,
    height: 22,
    color: rgb(0.97, 0.97, 0.97),
    borderColor: lineColor,
    borderWidth: 0.5,
  });
  page.drawText('CONFIDENTIAL PAYROLL DOCUMENT', {
    x: margin + 15,
    y: footerY + 12,
    size: 7,
    font: fontBold,
    color: mutedColor,
  });

  page.drawLine({
    start: { x: margin, y: footerY },
    end: { x: width - margin, y: footerY },
    thickness: 0.5,
    color: lineColor,
  });

  page.drawText(
    'This is a system-generated salary slip and does not require a physical signature.',
    {
      x: margin,
      y: footerY - 15,
      size: 7,
      font: fontRegular,
      color: mutedColor,
    }
  );

  page.drawText(
    `Generated on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })} by ${companyName}`,
    {
      x: margin,
      y: footerY - 28,
      size: 7,
      font: fontRegular,
      color: mutedColor,
    }
  );

  // Password info
  if (withPassword) {
    const firstName = (employee.name || '').split(' ')[0]?.toLowerCase() || '';
    let birthYear = '';
    if (employee.date_of_birth) {
      const parts = String(employee.date_of_birth).split(/[-/]/);
      birthYear = parts.find(p => p.length === 4) || parts[parts.length - 1] || '';
    }
    const password = birthYear ? `${firstName}${birthYear}` : employee.employee_id;

    page.drawText(
      `Document Password: ${password}`,
      {
        x: margin,
        y: footerY - 41,
        size: 7,
        font: fontRegular,
        color: mutedColor,
      }
    );
  }

  // Verify link at bottom-right
  const verifyText = 'Verify at payrollflow.vercel.app';
  const verifyWidth = fontRegular.widthOfTextAtSize(verifyText, 7);
  page.drawText(verifyText, {
    x: width - margin - verifyWidth,
    y: footerY - 41,
    size: 7,
    font: fontRegular,
    color: primaryColor,
  });

  return await pdfDoc.save();
}
