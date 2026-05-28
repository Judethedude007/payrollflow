// ============================================================
// PayrollFlow Type Definitions
// ============================================================

/** Employee record stored in database */
export interface Employee {
  id?: number;
  employee_id: string;
  name: string;
  email: string;
  designation: string;
  department: string;
  date_of_birth?: string; // For PDF password: firstname + birthyear
  created_at?: string;
}

/** Salary record stored in database */
export interface SalaryRecord {
  id?: number;
  employee_id: string;
  base_salary: number;
  hra: number;
  allowances: number;
  deductions: number;
  month: string;
  year: string;
  net_salary: number;
  gross_salary?: number;
  created_at?: string;
}

/** Email delivery log */
export interface EmailLog {
  id?: number;
  employee_id: string;
  employee_name?: string;
  employee_email?: string;
  month?: string;
  year?: string;
  status: 'pending' | 'sent' | 'failed';
  error_message?: string;
  sent_at?: string;
}

/** A single row parsed from an uploaded Excel/CSV file */
export interface PayrollRow {
  rowIndex: number;
  employee_id: string;
  name: string;
  email: string;
  designation: string;
  department: string;
  date_of_birth: string;
  base_salary: number;
  hra: number;
  allowances: number;
  deductions: number;
  month: string;
  year: string;
  net_salary?: number;
  gross_salary?: number;
  isValid: boolean;
  errors: ValidationError[];
}

/** Validation error for a specific field in a row */
export interface ValidationError {
  rowIndex: number;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

/** Result from validating payroll data */
export interface ValidationResult {
  validRows: PayrollRow[];
  invalidRows: PayrollRow[];
  errors: ValidationError[];
  totalRows: number;
  validCount: number;
  errorCount: number;
}

/** Dashboard statistics */
export interface DashboardStats {
  totalEmployees: number;
  salarySlipsGenerated: number;
  emailsSent: number;
  currentMonth: string;
  currentYear: string;
  totalPayrollProcessed: number;
}

/** API response wrapper */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/** PDF generation options */
export interface PdfOptions {
  employee: Employee;
  salaryRecord: SalaryRecord;
  companyName?: string;
  companyLogo?: Uint8Array;
  withPassword?: boolean;
}

/** Email send options */
export interface EmailOptions {
  to: string;
  employeeName: string;
  month: string;
  year: string;
  pdfBuffer: Uint8Array;
  pdfFilename: string;
}
