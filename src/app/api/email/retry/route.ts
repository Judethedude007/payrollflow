// ============================================================
// Email Retry API — POST /api/email/retry
// Resend a salary slip email to a specific employee
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateSalarySlipPdf } from '@/lib/pdf';
import { sendSalarySlipEmail } from '@/lib/email';
import { getMonthName } from '@/utils/salary';
import type { Employee, SalaryRecord } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const { employeeId, month, year } = await req.json();

    if (!employeeId) {
      return NextResponse.json(
        { success: false, error: 'Employee ID is required' },
        { status: 400 }
      );
    }

    console.log(`[Email Retry] Retrying for ${employeeId}, ${month} ${year}`);

    // Fetch employee
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('*')
      .eq('employee_id', employeeId)
      .single();

    if (empError || !employee) {
      return NextResponse.json(
        { success: false, error: `Employee ${employeeId} not found` },
        { status: 404 }
      );
    }

    // Fetch salary record
    const { data: salaryRecord, error: salError } = await supabase
      .from('salary_records')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('month', month)
      .eq('year', String(year))
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (salError || !salaryRecord) {
      return NextResponse.json(
        { success: false, error: `No salary record found for ${employeeId} in ${month} ${year}` },
        { status: 404 }
      );
    }

    // Generate PDF
    const pdfBytes = await generateSalarySlipPdf({
      employee: employee as Employee,
      salaryRecord: salaryRecord as SalaryRecord,
    });

    // Send email
    const emailResult = await sendSalarySlipEmail({
      to: employee.email,
      employeeName: employee.name,
      month: getMonthName(month),
      year: String(year),
      pdfBuffer: Buffer.from(pdfBytes),
      pdfFilename: `SalarySlip_${employee.name.replace(/\s+/g, '_')}_${getMonthName(month)}_${year}.pdf`,
    });

    if (emailResult.success) {
      // Update email_log to 'sent'
      await supabase
        .from('email_logs')
        .update({
          status: 'sent',
          error_message: null,
          sent_at: new Date().toISOString(),
        })
        .eq('employee_id', employeeId)
        .eq('status', 'failed');

      return NextResponse.json({
        success: true,
        message: `Email resent to ${employee.email}`,
      });
    } else {
      // Update error message
      await supabase
        .from('email_logs')
        .update({
          error_message: emailResult.error || 'Retry failed',
          sent_at: new Date().toISOString(),
        })
        .eq('employee_id', employeeId)
        .eq('status', 'failed');

      return NextResponse.json(
        { success: false, error: emailResult.error || 'Failed to resend email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[Email Retry] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
