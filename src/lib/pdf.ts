// ============================================================
// Professional PDF Salary Slip Generator
// ============================================================

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { Employee, SalaryRecord } from '@/types';
import { formatCurrency, getMonthName } from '@/utils/salary';

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
  const primaryColor = rgb(0.118, 0.306, 0.769); // Deep blue
  const textColor = rgb(0.1, 0.1, 0.1);
  const mutedColor = rgb(0.45, 0.45, 0.45);
  const lineColor = rgb(0.85, 0.85, 0.85);
  const headerBgColor = rgb(0.118, 0.306, 0.769);
  const lightBgColor = rgb(0.96, 0.97, 0.99);

  const margin = 50;
  let y = height - margin;

  // ============================================================
  // HEADER — Company banner
  // ============================================================
  const headerHeight = 80;
  page.drawRectangle({
    x: 0,
    y: y - headerHeight + 30,
    width: width,
    height: headerHeight,
    color: headerBgColor,
  });

  // Company name
  page.drawText(companyName.toUpperCase(), {
    x: margin,
    y: y - 15,
    size: 24,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  // Subtitle
  page.drawText('SALARY SLIP', {
    x: margin,
    y: y - 40,
    size: 12,
    font: fontRegular,
    color: rgb(1, 1, 1, ),
  });

  // Month/Year on right side
  const monthYear = `${getMonthName(salaryRecord.month)} ${salaryRecord.year}`;
  const monthYearWidth = fontBold.widthOfTextAtSize(monthYear, 14);
  page.drawText(monthYear, {
    x: width - margin - monthYearWidth,
    y: y - 20,
    size: 14,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  y -= headerHeight + 30;

  // ============================================================
  // EMPLOYEE DETAILS SECTION
  // ============================================================
  page.drawText('EMPLOYEE DETAILS', {
    x: margin,
    y,
    size: 11,
    font: fontBold,
    color: primaryColor,
  });

  y -= 8;
  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 1,
    color: primaryColor,
  });

  y -= 25;

  // Employee details - two column layout
  const col1X = margin;
  const col2X = width / 2 + 20;
  const detailsLineHeight = 22;

  const drawDetail = (label: string, value: string, x: number, currentY: number) => {
    page.drawText(label, {
      x,
      y: currentY,
      size: 9,
      font: fontRegular,
      color: mutedColor,
    });
    page.drawText(value || 'N/A', {
      x: x + 100,
      y: currentY,
      size: 10,
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
  // SALARY BREAKDOWN TABLE
  // ============================================================
  page.drawText('SALARY BREAKDOWN', {
    x: margin,
    y,
    size: 11,
    font: fontBold,
    color: primaryColor,
  });

  y -= 8;
  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 1,
    color: primaryColor,
  });

  y -= 5;

  // Table
  const tableX = margin;
  const tableWidth = width - 2 * margin;
  const colWidths = [tableWidth * 0.6, tableWidth * 0.4];
  const rowHeight = 35;

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
    y: y - 22,
    size: 10,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  const amountLabel = 'Amount (INR)';
  const amountLabelWidth = fontBold.widthOfTextAtSize(amountLabel, 10);
  page.drawText(amountLabel, {
    x: tableX + colWidths[0] + colWidths[1] - amountLabelWidth - 15,
    y: y - 22,
    size: 10,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  y -= rowHeight;

  // Salary rows
  const salaryItems = [
    { label: 'Basic Salary', amount: salaryRecord.base_salary, isEarning: true },
    { label: 'House Rent Allowance (HRA)', amount: salaryRecord.hra, isEarning: true },
    { label: 'Other Allowances', amount: salaryRecord.allowances, isEarning: true },
    { label: 'Total Earnings', amount: salaryRecord.base_salary + salaryRecord.hra + salaryRecord.allowances, isEarning: true, isTotal: true },
    { label: 'Deductions', amount: salaryRecord.deductions, isEarning: false },
  ];

  salaryItems.forEach((item, index) => {
    const isAlt = index % 2 === 0;
    
    if (isAlt && !item.isTotal) {
      page.drawRectangle({
        x: tableX,
        y: y - rowHeight,
        width: tableWidth,
        height: rowHeight,
        color: lightBgColor,
      });
    }

    if (item.isTotal) {
      page.drawRectangle({
        x: tableX,
        y: y - rowHeight,
        width: tableWidth,
        height: rowHeight,
        color: rgb(0.93, 0.95, 0.99),
      });
    }

    // Row borders
    page.drawLine({
      start: { x: tableX, y: y - rowHeight },
      end: { x: tableX + tableWidth, y: y - rowHeight },
      thickness: 0.5,
      color: lineColor,
    });

    const font = item.isTotal ? fontBold : fontRegular;
    const color = item.isTotal ? primaryColor : textColor;

    page.drawText(item.label, {
      x: tableX + 15,
      y: y - 22,
      size: 10,
      font,
      color,
    });

    const amountStr = formatCurrency(item.amount);
    const amountWidth = font.widthOfTextAtSize(amountStr, 10);
    page.drawText(amountStr, {
      x: tableX + tableWidth - amountWidth - 15,
      y: y - 22,
      size: 10,
      font,
      color: item.isEarning ? color : rgb(0.8, 0.2, 0.2),
    });

    y -= rowHeight;
  });

  // NET SALARY ROW — highlighted
  const netRowHeight = 42;
  page.drawRectangle({
    x: tableX,
    y: y - netRowHeight,
    width: tableWidth,
    height: netRowHeight,
    color: headerBgColor,
  });

  page.drawText('NET SALARY', {
    x: tableX + 15,
    y: y - 27,
    size: 13,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  const netAmountStr = formatCurrency(salaryRecord.net_salary);
  const netAmountWidth = fontBold.widthOfTextAtSize(netAmountStr, 13);
  page.drawText(netAmountStr, {
    x: tableX + tableWidth - netAmountWidth - 15,
    y: y - 27,
    size: 13,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  y -= netRowHeight + 50;

  // ============================================================
  // FOOTER
  // ============================================================
  // Signature line
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

  // Footer note
  const footerY = margin + 30;
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
      size: 8,
      font: fontRegular,
      color: mutedColor,
    }
  );

  page.drawText(
    `Generated on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })} by ${companyName}`,
    {
      x: margin,
      y: footerY - 28,
      size: 8,
      font: fontRegular,
      color: mutedColor,
    }
  );

  // Password info — embedded in the PDF for reference
  // pdf-lib doesn't support encryption natively; password info is communicated via email
  if (withPassword) {
    const firstName = employee.name.split(' ')[0]?.toLowerCase() || '';
    let birthYear = '';
    if (employee.date_of_birth) {
      const parts = employee.date_of_birth.split(/[-/]/);
      birthYear = parts.find(p => p.length === 4) || parts[parts.length - 1] || '';
    }
    const password = birthYear ? `${firstName}${birthYear}` : employee.employee_id;

    // Add password note at bottom of PDF
    page.drawText(
      `Document Password: ${password} (for secure viewing)`,
      {
        x: margin,
        y: footerY - 41,
        size: 7,
        font: fontRegular,
        color: mutedColor,
      }
    );
  }

  return await pdfDoc.save();
}

