// ============================================================
// Input Sanitization Utilities
// ============================================================

/**
 * Strip HTML tags, script tags, and dangerous characters from a string.
 * Used to sanitize employee names, emails, etc. before DB insert or HTML rendering.
 */
export function sanitizeString(input: unknown): string {
  if (!input) return '';
  return String(input)
    .replace(/<[^>]*>/g, '')           // Strip HTML tags
    .replace(/&lt;|&gt;|&amp;/g, '')   // Strip HTML entities
    .replace(/javascript:/gi, '')       // Strip JS protocol
    .replace(/on\w+\s*=/gi, '')        // Strip event handlers
    .trim();
}

/**
 * Sanitize and validate an email address.
 * Returns the cleaned email or empty string if invalid.
 */
export function sanitizeEmail(email: unknown): string {
  if (!email) return '';
  const cleaned = String(email).trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(cleaned) ? cleaned : cleaned;
}

/**
 * Sanitize a numeric input — ensure it's a valid non-negative number.
 */
export function sanitizeNumeric(value: unknown): number {
  if (value === null || value === undefined || value === '') return 0;
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  if (isNaN(num) || !isFinite(num)) return 0;
  return Math.max(0, num);
}

/**
 * Validate that a file is an accepted type (by MIME type and extension).
 */
export function isValidUploadFile(file: File): { valid: boolean; error?: string } {
  // Check extension
  const ext = file.name.toLowerCase().split('.').pop();
  const validExtensions = ['xlsx', 'xls', 'csv'];
  if (!ext || !validExtensions.includes(ext)) {
    return { valid: false, error: `Unsupported file type ".${ext}". Only .csv, .xlsx, and .xls files are allowed.` };
  }

  // Check MIME type
  const validMimeTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'text/csv',                 // .csv
    'application/csv',          // alternate csv
    'text/plain',               // some systems report csv as text/plain
  ];
  // Only check MIME if the browser provides one (some don't)
  if (file.type && !validMimeTypes.includes(file.type)) {
    return { valid: false, error: `Invalid file type "${file.type}". Only Excel and CSV files are accepted.` };
  }

  // Check file size (5MB limit)
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  if (file.size > MAX_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return { valid: false, error: `File size (${sizeMB}MB) exceeds the 5MB limit.` };
  }

  return { valid: true };
}
