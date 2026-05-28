// ============================================================
// Payroll Data Validation Engine
// ============================================================

import type { PayrollRow, ValidationError, ValidationResult } from '@/types';

/**
 * Validate an array of parsed payroll rows.
 * Returns structured results with valid/invalid segregation.
 */
export function validatePayrollData(rows: PayrollRow[]): ValidationResult {
  const validRows: PayrollRow[] = [];
  const invalidRows: PayrollRow[] = [];
  const allErrors: ValidationError[] = [];
  const seenIds = new Set<string>();

  for (const row of rows) {
    const rowErrors: ValidationError[] = [];

    // 1. Employee ID checks
    if (!row.employee_id || row.employee_id.trim() === '') {
      rowErrors.push({
        rowIndex: row.rowIndex,
        field: 'employee_id',
        message: 'Employee ID is required',
        severity: 'error',
      });
    } else if (seenIds.has(row.employee_id.trim())) {
      rowErrors.push({
        rowIndex: row.rowIndex,
        field: 'employee_id',
        message: `Duplicate Employee ID: ${row.employee_id}`,
        severity: 'error',
      });
    } else {
      seenIds.add(row.employee_id.trim());
    }

    // 2. Name check
    if (!row.name || row.name.trim() === '') {
      rowErrors.push({
        rowIndex: row.rowIndex,
        field: 'name',
        message: 'Employee name is required',
        severity: 'error',
      });
    }

    // 3. Email validation
    if (!row.email || row.email.trim() === '') {
      rowErrors.push({
        rowIndex: row.rowIndex,
        field: 'email',
        message: 'Email address is required',
        severity: 'error',
      });
    } else if (!isValidEmail(row.email)) {
      rowErrors.push({
        rowIndex: row.rowIndex,
        field: 'email',
        message: 'Invalid email format',
        severity: 'error',
      });
    }

    // 4. Salary validation
    if (row.base_salary === undefined || row.base_salary === null || isNaN(Number(row.base_salary))) {
      rowErrors.push({
        rowIndex: row.rowIndex,
        field: 'base_salary',
        message: 'Base salary must be a valid number',
        severity: 'error',
      });
    } else if (Number(row.base_salary) < 0) {
      rowErrors.push({
        rowIndex: row.rowIndex,
        field: 'base_salary',
        message: 'Base salary cannot be negative',
        severity: 'error',
      });
    }

    // 5. HRA validation (optional but must be non-negative)
    if (row.hra !== undefined && row.hra !== null && Number(row.hra) < 0) {
      rowErrors.push({
        rowIndex: row.rowIndex,
        field: 'hra',
        message: 'HRA cannot be negative',
        severity: 'error',
      });
    }

    // 6. Allowances validation
    if (row.allowances !== undefined && row.allowances !== null && Number(row.allowances) < 0) {
      rowErrors.push({
        rowIndex: row.rowIndex,
        field: 'allowances',
        message: 'Allowances cannot be negative',
        severity: 'error',
      });
    }

    // 7. Deductions validation
    if (row.deductions !== undefined && row.deductions !== null && Number(row.deductions) < 0) {
      rowErrors.push({
        rowIndex: row.rowIndex,
        field: 'deductions',
        message: 'Deductions cannot be negative',
        severity: 'error',
      });
    }

    // 8. Check if deductions exceed gross
    const gross = Number(row.base_salary || 0) + Number(row.hra || 0) + Number(row.allowances || 0);
    if (Number(row.deductions || 0) > gross) {
      rowErrors.push({
        rowIndex: row.rowIndex,
        field: 'deductions',
        message: 'Deductions exceed gross salary',
        severity: 'warning',
      });
    }

    // 9. Month validation
    if (!row.month || row.month.trim() === '') {
      rowErrors.push({
        rowIndex: row.rowIndex,
        field: 'month',
        message: 'Month is required',
        severity: 'error',
      });
    }

    // 10. Year validation
    if (!row.year || row.year.trim() === '') {
      rowErrors.push({
        rowIndex: row.rowIndex,
        field: 'year',
        message: 'Year is required',
        severity: 'error',
      });
    }

    // Classify row
    const hasErrors = rowErrors.some((e) => e.severity === 'error');
    row.errors = rowErrors;
    row.isValid = !hasErrors;

    if (hasErrors) {
      invalidRows.push(row);
    } else {
      validRows.push(row);
    }
    allErrors.push(...rowErrors);
  }

  return {
    validRows,
    invalidRows,
    errors: allErrors,
    totalRows: rows.length,
    validCount: validRows.length,
    errorCount: invalidRows.length,
  };
}

/**
 * Validate email format using RFC-compliant regex
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}
