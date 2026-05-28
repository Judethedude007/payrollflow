'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared/empty-state';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import {
  Search,
  Download,
  FileText,
  Loader2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatCurrency, getMonthName } from '@/utils/salary';

interface SalaryRecordWithEmployee {
  id: number;
  employee_id: string;
  base_salary: number;
  hra: number;
  allowances: number;
  deductions: number;
  month: string;
  year: string;
  net_salary: number;
  created_at: string;
  employees?: {
    name: string;
    email: string;
    designation: string;
    department: string;
  };
}

export default function RecordsPage() {
  const router = useRouter();
  const [records, setRecords] = useState<SalaryRecordWithEmployee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    const isAuth = localStorage.getItem('payrollflow_auth');
    if (isAuth !== 'true') {
      router.replace('/login');
      return;
    }
    fetchRecords();
  }, [router]);

  const fetchRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('salary_records')
        .select(`
          *,
          employees (name, email, designation, department)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecords((data as SalaryRecordWithEmployee[]) || []);
    } catch (error) {
      console.error('Failed to fetch records:', error);
      toast.error('Failed to load salary records');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPdf = async (record: SalaryRecordWithEmployee) => {
    setDownloadingId(record.employee_id);
    try {
      const res = await fetch('/api/salary/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeIds: [record.employee_id],
          month: record.month,
          year: record.year,
        }),
      });

      const data = await res.json();

      if (data.success && data.data.pdfs.length > 0) {
        const pdf = data.data.pdfs[0];
        const link = document.createElement('a');
        link.href = `data:application/pdf;base64,${pdf.pdf}`;
        link.download = `SalarySlip_${pdf.name.replace(/\s+/g, '_')}_${getMonthName(record.month)}_${record.year}.pdf`;
        link.click();
        toast.success('PDF downloaded!');
      }
    } catch {
      toast.error('Failed to download PDF');
    } finally {
      setDownloadingId(null);
    }
  };

  const filteredRecords = records.filter(
    (r) =>
      r.employee_id.toLowerCase().includes(search.toLowerCase()) ||
      r.employees?.name?.toLowerCase().includes(search.toLowerCase()) ||
      getMonthName(r.month).toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <TableSkeleton rows={8} />;

  if (records.length === 0) {
    return (
      <EmptyState
        icon="database"
        title="No salary records yet"
        description="Upload a payroll file and save it to the database to see records here."
        actionLabel="Upload Payroll"
        onAction={() => router.push('/upload')}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by employee, month..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Badge variant="outline" className="text-xs">
          {records.length} records
        </Badge>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-semibold">Employee</TableHead>
                <TableHead className="font-semibold">Department</TableHead>
                <TableHead className="font-semibold">Period</TableHead>
                <TableHead className="text-right font-semibold">Gross</TableHead>
                <TableHead className="text-right font-semibold">Deductions</TableHead>
                <TableHead className="text-right font-semibold">Net Salary</TableHead>
                <TableHead className="text-center font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map((record) => (
                <TableRow key={record.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">
                        {record.employees?.name || record.employee_id}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {record.employee_id}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {record.employees?.department || '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs font-normal">
                      {getMonthName(record.month)} {record.year}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatCurrency(
                      record.base_salary + record.hra + record.allowances
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-red-500">
                    {record.deductions > 0
                      ? `-${formatCurrency(record.deductions)}`
                      : '—'}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm font-semibold">
                    {formatCurrency(record.net_salary)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownloadPdf(record)}
                      disabled={downloadingId === record.employee_id}
                      className="gap-1.5"
                    >
                      {downloadingId === record.employee_id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                      PDF
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
