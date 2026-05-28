import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Get total employees count
    const { count: totalEmployees } = await supabase
      .from('employees')
      .select('*', { count: 'exact', head: true });

    // Get total salary records count
    const { count: salarySlipsGenerated } = await supabase
      .from('salary_records')
      .select('*', { count: 'exact', head: true });

    // Get sent emails count
    const { count: emailsSent } = await supabase
      .from('email_logs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'sent');

    // Get total payroll processed (sum of net_salary)
    const { data: payrollData } = await supabase
      .from('salary_records')
      .select('net_salary');

    const totalPayrollProcessed = payrollData?.reduce(
      (sum, record) => sum + Number(record.net_salary || 0),
      0
    ) ?? 0;

    const now = new Date();

    return NextResponse.json({
      success: true,
      data: {
        totalEmployees: totalEmployees ?? 0,
        salarySlipsGenerated: salarySlipsGenerated ?? 0,
        emailsSent: emailsSent ?? 0,
        currentMonth: now.toLocaleString('default', { month: 'long' }),
        currentYear: now.getFullYear().toString(),
        totalPayrollProcessed,
      },
    });
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
