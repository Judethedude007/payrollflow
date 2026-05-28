import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateSalarySlipPdf } from '@/lib/pdf';
import type { Employee, SalaryRecord } from '@/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { employeeIds, month, year } = body as {
      employeeIds: string[];
      month: string;
      year: string;
    };

    console.log('[PDF Generate] Request:', { employeeIds, month, year });

    if (!employeeIds?.length || !month || !year) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: employeeIds, month, year' },
        { status: 400 }
      );
    }

    const results = {
      generated: 0,
      failed: 0,
      errors: [] as string[],
      pdfs: [] as { employee_id: string; name: string; pdf: string }[],
    };

    for (const empId of employeeIds) {
      try {
        // Fetch employee
        const { data: employee, error: empError } = await supabase
          .from('employees')
          .select('*')
          .eq('employee_id', empId)
          .single();

        if (empError) {
          const msg = `Employee ${empId}: ${empError.message} (code: ${empError.code})`;
          console.error('[PDF Generate]', msg);
          results.errors.push(msg);
          results.failed++;
          continue;
        }

        if (!employee) {
          const msg = `Employee ${empId}: Not found in database`;
          console.error('[PDF Generate]', msg);
          results.errors.push(msg);
          results.failed++;
          continue;
        }

        // Fetch salary record
        const { data: salaryRecord, error: salaryError } = await supabase
          .from('salary_records')
          .select('*')
          .eq('employee_id', empId)
          .eq('month', String(month))
          .eq('year', String(year))
          .single();

        if (salaryError) {
          const msg = `Salary record for ${empId} (${month}/${year}): ${salaryError.message} (code: ${salaryError.code})`;
          console.error('[PDF Generate]', msg);
          results.errors.push(msg);
          results.failed++;
          continue;
        }

        if (!salaryRecord) {
          const msg = `No salary record found for ${empId} in ${month}/${year}`;
          console.error('[PDF Generate]', msg);
          results.errors.push(msg);
          results.failed++;
          continue;
        }

        console.log(`[PDF Generate] Generating PDF for ${empId} (${employee.name})`);

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
        console.log(`[PDF Generate] Success for ${empId}`);
      } catch (err) {
        const msg = `PDF generation failed for ${empId}: ${err instanceof Error ? err.message : String(err)}`;
        console.error('[PDF Generate]', msg);
        results.errors.push(msg);
        results.failed++;
      }
    }

    console.log(`[PDF Generate] Done: ${results.generated} generated, ${results.failed} failed`);

    return NextResponse.json({
      success: results.generated > 0,
      data: results,
      message: results.generated > 0
        ? `Generated ${results.generated} PDFs`
        : `No PDFs generated. ${results.errors.join('; ')}`,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    console.error('[PDF Generate] Fatal error:', msg);
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
