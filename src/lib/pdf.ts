// ============================================================
// Professional PDF Salary Slip Generator
// ============================================================

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
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
 * Safely encode a string for WinAnsi (strip non-encodable chars)
 */
function safeText(text: string): string {
  if (!text) return 'N/A';
  return String(text).replace(/[^\x20-\x7E]/g, '');
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
  // EMBED LOGO
  // ============================================================
  let logoImage: Awaited<ReturnType<typeof pdfDoc.embedPng>> | null = null;
  try {
    const logoPath = path.join(process.cwd(), 'public', 'logo.png');
    if (fs.existsSync(logoPath)) {
      const logoBytes = fs.readFileSync(logoPath);
      logoImage = await pdfDoc.embedPng(logoBytes);
    }
  } catch (e) {
    console.warn('Could not embed logo:', e);
  }

  // ============================================================
  // HEADER - Company banner
  // ============================================================
  const headerHeight = 80;

  // Dark blue base
  page.drawRectangle({
    x: 0,
    y: y - headerHeight + 30,
    width: width,
    height: headerHeight,
    color: darkBlue,
  });

  // Lighter overlay for gradient feel
  page.drawRectangle({
    x: 0,
    y: y - headerHeight + 50,
    width: width,
    height: headerHeight - 20,
    color: headerBgColor,
  });

  // Logo (if available)
  let textStartX = margin;
  if (logoImage) {
    const logoScale = 36 / logoImage.height;
    const logoW = logoImage.width * logoScale;
    const logoH = 36;
    page.drawImage(logoImage, {
      x: margin,
      y: y - 30,
      width: logoW,
      height: logoH,
    });
    textStartX = margin + logoW + 10;
  }

  // Company name
  page.drawText(safeText(companyName.toUpperCase()), {
    x: textStartX,
    y: y - 12,
    size: 22,
    font: fontBold,
    color: white,
  });

  // Subtitle
  page.drawText('SALARY SLIP', {
    x: textStartX,
    y: y - 32,
    size: 10,
    font: fontRegular,
    color: rgb(0.8, 0.85, 1),
  });

  // Month/Year on right side
  const monthName = getMonthName(salaryRecord.month);
  const monthYear = `${monthName} ${salaryRecord.year}`;
  const monthYearWidth = fontBold.widthOfTextAtSize(monthYear, 14);
  page.drawText(monthYear, {
    x: width - margin - monthYearWidth,
    y: y - 15,
    size: 14,
    font: fontBold,
    color: white,
  });

  // Generated Date (uses the salary month, not today)
  const generatedDate = `Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`;
  const genDateWidth = fontRegular.widthOfTextAtSize(generatedDate, 8);
  page.drawText(generatedDate, {
    x: width - margin - genDateWidth,
    y: y - 32,
    size: 8,
    font: fontRegular,
    color: rgb(0.8, 0.85, 1),
  });

  y -= headerHeight + 25;

  // ============================================================
  // EMPLOYEE DETAILS - Card style
  // ============================================================
  const detailsBoxHeight = 82;
  page.drawRectangle({
    x: margin,
    y: y - detailsBoxHeight + 12,
    width: width - 2 * margin,
    height: detailsBoxHeight,
    color: lightBgColor,
    borderColor: lineColor,
    borderWidth: 0.5,
  });

  page.drawText('EMPLOYEE DETAILS', {
    x: margin + 15,
    y: y,
    size: 9,
    font: fontBold,
    color: primaryColor,
  });

  y -= 20;

  const col1X = margin + 15;
  const col2X = width / 2 + 20;
  const labelOffset = 100;
  const detailsLineHeight = 18;

  const drawDetail = (label: string, value: string, x: number, currentY: number) => {
    page.drawText(label, {
      x,
      y: currentY,
      size: 8,
      font: fontRegular,
      color: mutedColor,
    });
    page.drawText(safeText(value), {
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

  y -= 35;

  // ============================================================
  // SALARY BREAKDOWN TABLE
  // ============================================================
  page.drawText('SALARY BREAKDOWN', {
    x: margin,
    y,
    size: 9,
    font: fontBold,
    color: primaryColor,
  });

  y -= 5;
  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 1.5,
    color: primaryColor,
  });
  y -= 2;

  const tableX = margin;
  const tableWidth = width - 2 * margin;
  const rowHeight = 30;

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
    y: y - 19,
    size: 9,
    font: fontBold,
    color: white,
  });

  const amountLabel = 'Amount (INR)';
  const amountLabelWidth = fontBold.widthOfTextAtSize(amountLabel, 9);
  page.drawText(amountLabel, {
    x: tableX + tableWidth - amountLabelWidth - 15,
    y: y - 19,
    size: 9,
    font: fontBold,
    color: white,
  });

  y -= rowHeight;

  // Safe numeric values
  const baseSalary = Number(salaryRecord.base_salary) || 0;
  const hra = Number(salaryRecord.hra) || 0;
  const allowances = Number(salaryRecord.allowances) || 0;
  const deductions = Number(salaryRecord.deductions) || 0;
  const netSalary = Number(salaryRecord.net_salary) || 0;

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
      y: y - 19,
      size: 9,
      font,
      color: labelColor,
    });

    const amountStr = formatCurrencyForPdf(item.amount);
    const amtWidth = font.widthOfTextAtSize(amountStr, 9);
    page.drawText(amountStr, {
      x: tableX + tableWidth - amtWidth - 15,
      y: y - 19,
      size: 9,
      font,
      color: item.isEarning ? labelColor : rgb(0.8, 0.15, 0.15),
    });

    y -= rowHeight;
  });

  // ============================================================
  // NET SALARY - Big green highlighted box
  // ============================================================
  const netRowHeight = 44;
  page.drawRectangle({
    x: tableX,
    y: y - netRowHeight,
    width: tableWidth,
    height: netRowHeight,
    color: accentGreen,
  });

  page.drawText('NET SALARY', {
    x: tableX + 15,
    y: y - 28,
    size: 14,
    font: fontBold,
    color: white,
  });

  const netAmountStr = formatCurrencyForPdf(netSalary);
  const netAmountWidth = fontBold.widthOfTextAtSize(netAmountStr, 16);
  page.drawText(netAmountStr, {
    x: tableX + tableWidth - netAmountWidth - 15,
    y: y - 28,
    size: 16,
    font: fontBold,
    color: white,
  });

  y -= netRowHeight + 30;

  // ============================================================
  // SIGNATURE (tighter — moved up)
  // ============================================================
  page.drawLine({
    start: { x: width - margin - 170, y: y },
    end: { x: width - margin, y: y },
    thickness: 0.5,
    color: textColor,
  });

  page.drawText('Authorized Signatory', {
    x: width - margin - 140,
    y: y - 14,
    size: 8,
    font: fontRegular,
    color: mutedColor,
  });

  // ============================================================
  // QR CODE
  // ============================================================
  let qrImage: Awaited<ReturnType<typeof pdfDoc.embedPng>> | null = null;
  try {
    const qrUrl = 'https://payrollflow.vercel.app';
    const qrDataUrl = await QRCode.toDataURL(qrUrl, {
      width: 200,
      margin: 1,
      color: { dark: '#1e4ec4', light: '#ffffff' },
    });
    const qrBase64 = qrDataUrl.split(',')[1];
    const qrBytes = Buffer.from(qrBase64, 'base64');
    qrImage = await pdfDoc.embedPng(qrBytes);
  } catch (e) {
    console.warn('Could not generate QR code:', e);
  }

  // ============================================================
  // FOOTER - Tighter composition
  // ============================================================
  const footerY = margin + 20;

  // QR code bottom-right
  if (qrImage) {
    const qrSize = 52;
    page.drawImage(qrImage, {
      x: width - margin - qrSize,
      y: footerY - 5,
      width: qrSize,
      height: qrSize,
    });
    const verifyText = 'Verify Document';
    const verifyWidth = fontRegular.widthOfTextAtSize(verifyText, 6);
    page.drawText(verifyText, {
      x: width - margin - qrSize / 2 - verifyWidth / 2,
      y: footerY - 12,
      size: 6,
      font: fontRegular,
      color: primaryColor,
    });
  }

  // Confidential banner
  page.drawRectangle({
    x: margin,
    y: footerY + 50,
    width: width - 2 * margin - (qrImage ? 70 : 0),
    height: 20,
    color: rgb(0.97, 0.97, 0.97),
    borderColor: lineColor,
    borderWidth: 0.5,
  });
  page.drawText('CONFIDENTIAL PAYROLL DOCUMENT', {
    x: margin + 12,
    y: footerY + 56,
    size: 7,
    font: fontBold,
    color: mutedColor,
  });

  // Divider line
  page.drawLine({
    start: { x: margin, y: footerY + 45 },
    end: { x: width - margin - (qrImage ? 70 : 0), y: footerY + 45 },
    thickness: 0.5,
    color: lineColor,
  });

  page.drawText(
    'This is a system-generated salary slip and does not require a physical signature.',
    {
      x: margin,
      y: footerY + 32,
      size: 7,
      font: fontRegular,
      color: mutedColor,
    }
  );

  page.drawText(
    `Generated on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })} by ${safeText(companyName)}`,
    {
      x: margin,
      y: footerY + 20,
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
      `Document Password: ${safeText(password)}`,
      {
        x: margin,
        y: footerY + 8,
        size: 7,
        font: fontRegular,
        color: mutedColor,
      }
    );
  }

  return await pdfDoc.save();
}
