import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateSalarySlipPdf } from '@/lib/pdf';
import { sendSalarySlipEmail } from '@/lib/email';
import { getMonthName } from '@/utils/salary';
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
      sent: 0,
      failed: 0,
      details: [] as { employee_id: string; status: string; error?: string }[],
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
          results.details.push({
            employee_id: empId,
            status: 'failed',
            error: 'Employee not found',
          });
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
          results.details.push({
            employee_id: empId,
            status: 'failed',
            error: 'No salary record found for this period',
          });
          continue;
        }

        // Generate PDF
        const pdfBytes = await generateSalarySlipPdf({
          employee: employee as Employee,
          salaryRecord: salaryRecord as SalaryRecord,
          withPassword: true,
        });

        // Send email
        const monthName = getMonthName(month);
        const emailResult = await sendSalarySlipEmail({
          to: employee.email,
          employeeName: employee.name,
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
          results.details.push({ employee_id: empId, status: 'sent' });
        } else {
          results.failed++;
          results.details.push({
            employee_id: empId,
            status: 'failed',
            error: emailResult.error,
          });
        }
      } catch (err) {
        results.failed++;
        results.details.push({
          employee_id: empId,
          status: 'failed',
          error: err instanceof Error ? err.message : 'Unknown error',
        });

        // Log failure
        await supabase.from('email_logs').insert({
          employee_id: empId,
          status: 'failed',
          error_message: err instanceof Error ? err.message : 'Unknown error',
          sent_at: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
      message: `Sent ${results.sent} emails, ${results.failed} failed`,
    });
  } catch (error) {
    console.error('Email send API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
