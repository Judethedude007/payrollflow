import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { PayrollRow } from '@/types';
import { calculateNetSalary, calculateGrossSalary } from '@/utils/salary';
import { sanitizeString } from '@/utils/sanitize';

export async function POST(request: Request) {
  try {
    const { rows } = (await request.json()) as { rows: PayrollRow[] };

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No data provided' },
        { status: 400 }
      );
    }

    const results = {
      employeesInserted: 0,
      salaryRecordsInserted: 0,
      errors: [] as string[],
    };

    for (const row of rows) {
      try {
        // Upsert employee (sanitize string inputs)
        const { error: empError } = await supabase
          .from('employees')
          .upsert(
            {
              employee_id: sanitizeString(row.employee_id),
              name: sanitizeString(row.name),
              email: sanitizeString(row.email).toLowerCase(),
              designation: sanitizeString(row.designation) || '',
              department: sanitizeString(row.department) || '',
              date_of_birth: row.date_of_birth || null,
            },
            { onConflict: 'employee_id' }
          );

        if (empError) {
          results.errors.push(
            `Employee ${row.employee_id}: ${empError.message}`
          );
          continue;
        }
        results.employeesInserted++;

        // Calculate salary
        const netSalary = calculateNetSalary(
          row.base_salary,
          row.hra,
          row.allowances,
          row.deductions
        );
        const grossSalary = calculateGrossSalary(
          row.base_salary,
          row.hra,
          row.allowances
        );

        // Delete existing salary record for same period (prevent duplicates)
        await supabase
          .from('salary_records')
          .delete()
          .eq('employee_id', row.employee_id)
          .eq('month', String(row.month))
          .eq('year', String(row.year));

        // Insert salary record
        const { error: salaryError } = await supabase
          .from('salary_records')
          .insert({
            employee_id: row.employee_id,
            base_salary: row.base_salary,
            hra: row.hra || 0,
            allowances: row.allowances || 0,
            deductions: row.deductions || 0,
            month: String(row.month),
            year: String(row.year),
            net_salary: netSalary,
          });

        if (salaryError) {
          results.errors.push(
            `Salary record for ${row.employee_id}: ${salaryError.message}`
          );
          continue;
        }
        results.salaryRecordsInserted++;
      } catch (err) {
        results.errors.push(
          `Row ${row.rowIndex}: ${err instanceof Error ? err.message : 'Unknown error'}`
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
      message: `Processed ${results.employeesInserted} employees and ${results.salaryRecordsInserted} salary records`,
    });
  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
