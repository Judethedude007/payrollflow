// ============================================================
// Salary Calculation Engine
// ============================================================

/**
 * Calculate gross salary: Base Salary + HRA + Allowances
 */
export function calculateGrossSalary(
  baseSalary: number,
  hra: number,
  allowances: number
): number {
  return sanitizeNumber(baseSalary) + sanitizeNumber(hra) + sanitizeNumber(allowances);
}

/**
 * Calculate net salary: Gross Salary - Deductions
 * Formula: (Base Salary + HRA + Allowances) - Deductions
 */
export function calculateNetSalary(
  baseSalary: number,
  hra: number,
  allowances: number,
  deductions: number
): number {
  const gross = calculateGrossSalary(baseSalary, hra, allowances);
  const net = gross - sanitizeNumber(deductions);
  return Math.max(0, Math.round(net * 100) / 100); // Ensure non-negative, round to 2 decimals
}

/**
 * Sanitize a numeric input: ensure it's a valid non-negative number
 */
export function sanitizeNumber(value: unknown): number {
  if (value === null || value === undefined || value === '') return 0;
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  if (isNaN(num) || !isFinite(num)) return 0;
  return Math.max(0, num);
}

/**
 * Format a number as Indian Rupee currency (for web UI — uses ₹ symbol)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a number as Indian Rupee currency for PDF (uses "Rs." instead of ₹)
 * Standard PDF fonts (Helvetica, Times) only support WinAnsi encoding
 * and cannot render the ₹ symbol (U+20B9).
 */
export function formatCurrencyForPdf(amount: number): string {
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `Rs. ${formatted}`;
}

/**
 * Get the month name from a month number (1-12)
 */
export function getMonthName(month: string | number): string {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const idx = typeof month === 'string' ? parseInt(month, 10) - 1 : month - 1;
  return monthNames[idx] || String(month);
}
