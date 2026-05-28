import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateSalarySlipPdf } from '@/lib/pdf';
import type { Employee, SalaryRecord } from '@/types';

export async function POST(request: Request) {
  try {
    const { employeeIds, month, year } = (await request.json()) as {
      employeeIds: string[];
      month: string;
      year: string;
    };

    if (!employeeIds?.length || !month || !year) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const results = {
      generated: 0,
      failed: 0,
      pdfs: [] as { employee_id: string; name: string; pdf: string }[],
    };

    for (const empId of employeeIds) {
      try {
        // Fetch employee
        const { data: employee } = await supabase
          .from('employees')
          .select('*')
          .eq('employee_id', empId)
          .single();

        if (!employee) {
          results.failed++;
          continue;
        }

        // Fetch salary record
        const { data: salaryRecord } = await supabase
          .from('salary_records')
          .select('*')
          .eq('employee_id', empId)
          .eq('month', month)
          .eq('year', year)
          .single();

        if (!salaryRecord) {
          results.failed++;
          continue;
        }

        // Generate PDF
        const pdfBytes = await generateSalarySlipPdf({
          employee: employee as Employee,
          salaryRecord: salaryRecord as SalaryRecord,
          withPassword: true,
        });

        // Convert to base64 for client-side download
        const base64 = Buffer.from(pdfBytes).toString('base64');
        results.pdfs.push({
          employee_id: empId,
          name: employee.name,
          pdf: base64,
        });
        results.generated++;
      } catch (err) {
        results.failed++;
        console.error(`PDF generation failed for ${empId}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
      message: `Generated ${results.generated} PDFs`,
    });
  } catch (error) {
    console.error('Salary generate API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
