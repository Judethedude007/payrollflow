'use client';

import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/utils/salary';
import type { PayrollRow } from '@/types';

interface PreviewTableProps {
  rows: PayrollRow[];
  onRowUpdate?: (rowIndex: number, field: string, value: string) => void;
}

export function PreviewTable({ rows, onRowUpdate }: PreviewTableProps) {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Filter rows by search
  const filteredRows = rows.filter(
    (row) =>
      row.name.toLowerCase().includes(search.toLowerCase()) ||
      row.employee_id.toLowerCase().includes(search.toLowerCase()) ||
      row.email.toLowerCase().includes(search.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredRows.length / rowsPerPage);
  const paginatedRows = filteredRows.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, ID, or email..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-[40px] font-semibold">#</TableHead>
                <TableHead className="font-semibold">Employee ID</TableHead>
                <TableHead className="font-semibold">Name</TableHead>
                <TableHead className="font-semibold">Email</TableHead>
                <TableHead className="font-semibold">Designation</TableHead>
                <TableHead className="text-right font-semibold">Gross Salary</TableHead>
                <TableHead className="text-right font-semibold">Deductions</TableHead>
                <TableHead className="text-right font-semibold">Net Salary</TableHead>
                <TableHead className="text-center font-semibold">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRows.map((row) => (
                <TableRow
                  key={row.rowIndex}
                  className={`transition-colors ${
                    !row.isValid
                      ? 'bg-destructive/5 hover:bg-destructive/10'
                      : 'hover:bg-muted/30'
                  }`}
                >
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {row.rowIndex}
                  </TableCell>
                  <TableCell className="font-medium font-mono text-xs">
                    {row.employee_id || (
                      <span className="text-destructive italic">Missing</span>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{row.name || '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {row.email || (
                      <span className="text-destructive italic">Missing</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{row.designation || '—'}</TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatCurrency(row.gross_salary || 0)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-red-500">
                    {row.deductions > 0 ? `-${formatCurrency(row.deductions)}` : '—'}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm font-semibold">
                    {formatCurrency(row.net_salary || 0)}
                  </TableCell>
                  <TableCell className="text-center">
                    {row.isValid ? (
                      <Badge
                        variant="outline"
                        className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs"
                      >
                        Valid
                      </Badge>
                    ) : (
                      <div className="flex items-center justify-center gap-1">
                        <Badge
                          variant="outline"
                          className="bg-destructive/10 text-destructive border-destructive/30 text-xs"
                        >
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {row.errors.length} error{row.errors.length > 1 ? 's' : ''}
                        </Badge>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            Showing {(currentPage - 1) * rowsPerPage + 1}–
            {Math.min(currentPage * rowsPerPage, filteredRows.length)} of{' '}
            {filteredRows.length} rows
          </p>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`h-8 w-8 rounded-md text-xs font-medium transition-colors ${
                  currentPage === page
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
