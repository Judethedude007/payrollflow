// ============================================================
// Excel / CSV File Parser
// ============================================================

import * as XLSX from 'xlsx';
import type { PayrollRow } from '@/types';
import { calculateNetSalary, calculateGrossSalary, sanitizeNumber } from './salary';

/** Column header aliases — maps common variations to canonical field names */
const COLUMN_MAP: Record<string, string> = {
  // Employee ID
  'employee_id': 'employee_id',
  'employee id': 'employee_id',
  'emp_id': 'employee_id',
  'emp id': 'employee_id',
  'id': 'employee_id',
  'employeeid': 'employee_id',
  // Name
  'name': 'name',
  'employee_name': 'name',
  'employee name': 'name',
  'emp_name': 'name',
  'full_name': 'name',
  'full name': 'name',
  // Email
  'email': 'email',
  'email_address': 'email',
  'email address': 'email',
  'e-mail': 'email',
  'mail': 'email',
  // Designation
  'designation': 'designation',
  'role': 'designation',
  'title': 'designation',
  'job_title': 'designation',
  'job title': 'designation',
  'position': 'designation',
  // Department
  'department': 'department',
  'dept': 'department',
  'dept.': 'department',
  // Date of Birth
  'date_of_birth': 'date_of_birth',
  'date of birth': 'date_of_birth',
  'dob': 'date_of_birth',
  'birth_date': 'date_of_birth',
  'birthdate': 'date_of_birth',
  'birth date': 'date_of_birth',
  // Base Salary
  'base_salary': 'base_salary',
  'base salary': 'base_salary',
  'basic_salary': 'base_salary',
  'basic salary': 'base_salary',
  'basic': 'base_salary',
  'base': 'base_salary',
  'basic_pay': 'base_salary',
  'basic pay': 'base_salary',
  // HRA
  'hra': 'hra',
  'house_rent_allowance': 'hra',
  'house rent allowance': 'hra',
  'house_rent': 'hra',
  // Allowances
  'allowances': 'allowances',
  'other_allowances': 'allowances',
  'other allowances': 'allowances',
  'allowance': 'allowances',
  'special_allowance': 'allowances',
  'special allowance': 'allowances',
  // Deductions
  'deductions': 'deductions',
  'deduction': 'deductions',
  'total_deductions': 'deductions',
  'total deductions': 'deductions',
  // Month
  'month': 'month',
  'pay_month': 'month',
  'pay month': 'month',
  'salary_month': 'month',
  'salary month': 'month',
  // Year
  'year': 'year',
  'pay_year': 'year',
  'pay year': 'year',
  'salary_year': 'year',
  'salary year': 'year',
};

/**
 * Convert Excel serial date number to a DD-MM-YYYY string.
 * Excel serial dates count days since Jan 1, 1900 (with a leap-year bug).
 */
function excelSerialToDate(serial: number): string {
  // Excel incorrectly treats 1900 as a leap year — adjust for dates after Feb 28, 1900
  const adjusted = serial > 59 ? serial - 1 : serial;
  const epoch = new Date(1899, 11, 31); // Dec 31, 1899
  const date = new Date(epoch.getTime() + adjusted * 86400000);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Parse a date_of_birth value from Excel — could be a serial number, a Date, or a string
 */
function parseDateOfBirth(value: unknown): string {
  if (!value && value !== 0) return '';
  // If it's a number, it's an Excel serial date
  if (typeof value === 'number') {
    return excelSerialToDate(value);
  }
  // If it's already a Date object
  if (value instanceof Date) {
    const day = String(value.getDate()).padStart(2, '0');
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const year = value.getFullYear();
    return `${day}-${month}-${year}`;
  }
  // Otherwise treat as string
  return String(value).trim();
}

/**
 * Parse an uploaded Excel or CSV file into PayrollRow array
 */
export function parseExcelFile(buffer: ArrayBuffer): PayrollRow[] {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Convert to JSON with raw headers
  const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: '',
  });

  if (rawData.length === 0) return [];

  // Map headers to canonical field names
  const firstRow = rawData[0];
  const headerMap: Record<string, string> = {};

  for (const key of Object.keys(firstRow)) {
    const normalized = key.toLowerCase().trim();
    if (COLUMN_MAP[normalized]) {
      headerMap[key] = COLUMN_MAP[normalized];
    }
  }

  // Parse each row
  return rawData.map((raw, index) => {
    const mapped: Record<string, unknown> = {};
    for (const [originalKey, canonicalKey] of Object.entries(headerMap)) {
      mapped[canonicalKey] = raw[originalKey];
    }

    const baseSalary = sanitizeNumber(mapped.base_salary);
    const hra = sanitizeNumber(mapped.hra);
    const allowances = sanitizeNumber(mapped.allowances);
    const deductions = sanitizeNumber(mapped.deductions);

    return {
      rowIndex: index + 1,
      employee_id: String(mapped.employee_id || '').trim(),
      name: String(mapped.name || '').trim(),
      email: String(mapped.email || '').trim(),
      designation: String(mapped.designation || '').trim(),
      department: String(mapped.department || '').trim(),
      date_of_birth: parseDateOfBirth(mapped.date_of_birth),
      base_salary: baseSalary,
      hra,
      allowances,
      deductions,
      month: String(mapped.month || '').trim(),
      year: String(mapped.year || '').trim(),
      net_salary: calculateNetSalary(baseSalary, hra, allowances, deductions),
      gross_salary: calculateGrossSalary(baseSalary, hra, allowances),
      isValid: true,
      errors: [],
    } as PayrollRow;
  });
}

/**
 * Validate that the file is an accepted format
 */
export function isValidFileType(filename: string): boolean {
  const ext = filename.toLowerCase().split('.').pop();
  return ext === 'xlsx' || ext === 'xls' || ext === 'csv';
}

/**
 * Get expected columns for template download
 */
export function getExpectedColumns(): string[] {
  return [
    'Employee ID',
    'Name',
    'Email',
    'Designation',
    'Department',
    'Date of Birth',
    'Base Salary',
    'HRA',
    'Allowances',
    'Deductions',
    'Month',
    'Year',
  ];
}
