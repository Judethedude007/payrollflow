import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateSalarySlipPdf } from '@/lib/pdf';
import { sendSalarySlipEmail } from '@/lib/email';
import { getMonthName } from '@/utils/salary';
import { sanitizeString } from '@/utils/sanitize';
import type { Employee, SalaryRecord } from '@/types';

const MAX_EMAILS_PER_REQUEST = 50;

export async function POST(request: Request) {
  try {
    const { employeeIds, month, year } = (await request.json()) as {
      employeeIds: string[];
      month: string;
      year: string;
    };

    console.log('[Email Send] Request:', { employeeIds: employeeIds?.length, month, year });

    if (!employeeIds?.length || !month || !year) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Rate limit: max 50 emails per request
    if (employeeIds.length > MAX_EMAILS_PER_REQUEST) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many recipients. Maximum ${MAX_EMAILS_PER_REQUEST} emails per request.`,
        },
        { status: 429 }
      );
    }

    const results = {
      sent: 0,
      failed: 0,
      details: [] as { employee_id: string; name?: string; status: string; error?: string }[],
    };

    for (const empId of employeeIds) {
      try {
        // Fetch employee
        const { data: employee, error: empError } = await supabase
          .from('employees')
          .select('*')
          .eq('employee_id', empId)
          .single();

        if (empError || !employee) {
          const msg = empError?.message || 'Employee not found';
          console.error(`[Email Send] Employee ${empId}: ${msg}`);
          results.failed++;
          results.details.push({ employee_id: empId, status: 'failed', error: msg });
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

        if (salaryError || !salaryRecord) {
          const msg = salaryError?.message || 'No salary record for this period';
          console.error(`[Email Send] Salary ${empId}: ${msg}`);
          results.failed++;
          results.details.push({ employee_id: empId, name: employee.name, status: 'failed', error: msg });
          continue;
        }

        // Generate PDF
        console.log(`[Email Send] Generating PDF for ${employee.name}...`);
        const pdfBytes = await generateSalarySlipPdf({
          employee: employee as Employee,
          salaryRecord: salaryRecord as SalaryRecord,
          withPassword: true,
        });

        // Send email
        const monthName = getMonthName(month);
        console.log(`[Email Send] Sending to ${employee.email}...`);
        const emailResult = await sendSalarySlipEmail({
          to: employee.email,
          employeeName: sanitizeString(employee.name),
          month: monthName,
          year,
          pdfBuffer: pdfBytes,
          pdfFilename: `SalarySlip_${employee.name.replace(/\s+/g, '_')}_${monthName}_${year}.pdf`,
        });

        // Log email status
        await supabase.from('email_logs').insert({
          employee_id: empId,
          status: emailResult.success ? 'sent' : 'failed',
          error_message: emailResult.error || null,
          sent_at: new Date().toISOString(),
        });

        if (emailResult.success) {
          results.sent++;
          results.details.push({ employee_id: empId, name: employee.name, status: 'sent' });
          console.log(`[Email Send] Sent to ${employee.email}`);
        } else {
          results.failed++;
          results.details.push({ employee_id: empId, name: employee.name, status: 'failed', error: emailResult.error });
          console.error(`[Email Send] Failed for ${employee.email}: ${emailResult.error}`);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        console.error(`[Email Send] Error for ${empId}: ${msg}`);
        results.failed++;
        results.details.push({ employee_id: empId, status: 'failed', error: msg });

        try {
          await supabase.from('email_logs').insert({
            employee_id: empId,
            status: 'failed',
            error_message: msg,
            sent_at: new Date().toISOString(),
          });
        } catch {
          // Ignore logging errors
        }
      }
    }

    console.log(`[Email Send] Done: ${results.sent} sent, ${results.failed} failed`);

    return NextResponse.json({
      success: true,
      data: results,
      message: `Sent ${results.sent} emails, ${results.failed} failed`,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    console.error('[Email Send] Fatal error:', msg);
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
