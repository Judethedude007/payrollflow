import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateSalarySlipPdf } from '@/lib/pdf';
import type { Employee, SalaryRecord } from '@/types';
import JSZip from 'jszip';
import { getMonthName } from '@/utils/salary';

export async function POST(request: Request) {
  try {
    const { month, year } = (await request.json()) as {
      month: string;
      year: string;
    };

    if (!month || !year) {
      return NextResponse.json(
        { success: false, error: 'Month and year are required' },
        { status: 400 }
      );
    }

    // Fetch all salary records for the given month/year
    const { data: salaryRecords, error: salaryError } = await supabase
      .from('salary_records')
      .select('*')
      .eq('month', month)
      .eq('year', year);

    if (salaryError || !salaryRecords?.length) {
      return NextResponse.json(
        { success: false, error: 'No salary records found for this period' },
        { status: 404 }
      );
    }

    const zip = new JSZip();
    const monthName = getMonthName(month);

    for (const record of salaryRecords) {
      // Fetch employee details
      const { data: employee } = await supabase
        .from('employees')
        .select('*')
        .eq('employee_id', record.employee_id)
        .single();

      if (!employee) continue;

      // Generate PDF
      const pdfBytes = await generateSalarySlipPdf({
        employee: employee as Employee,
        salaryRecord: record as SalaryRecord,
        withPassword: true,
      });

      const filename = `SalarySlip_${employee.name.replace(/\s+/g, '_')}_${monthName}_${year}.pdf`;
      zip.file(filename, pdfBytes);
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    return new Response(Buffer.from(zipBuffer), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="SalarySlips_${monthName}_${year}.zip"`,
      },
    });
  } catch (error) {
    console.error('Download API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
