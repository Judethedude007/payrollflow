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

    // 11. Date of Birth validation (warning — optional field)
    if (row.date_of_birth && row.date_of_birth.trim() !== '') {
      if (!isValidDateOfBirth(row.date_of_birth)) {
        rowErrors.push({
          rowIndex: row.rowIndex,
          field: 'date_of_birth',
          message: 'Invalid date of birth format (expected DD-MM-YYYY)',
          severity: 'warning',
        });
      }
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

/**
 * Validate date of birth format (DD-MM-YYYY, DD/MM/YYYY, or YYYY-MM-DD)
 */
function isValidDateOfBirth(dob: string): boolean {
  const trimmed = dob.trim();

  // Match DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10);
    const year = parseInt(dmyMatch[3], 10);
    return day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 2020;
  }

  // Match YYYY-MM-DD
  const ymdMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10);
    const day = parseInt(ymdMatch[3], 10);
    return day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 2020;
  }

  return false;
}
