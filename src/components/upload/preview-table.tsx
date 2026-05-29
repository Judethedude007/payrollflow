'use client';

import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Search, AlertCircle, Pencil, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/utils/salary';
import type { PayrollRow } from '@/types';

interface PreviewTableProps {
  rows: PayrollRow[];
  onEdit?: (rowIndex: number) => void;
  onDelete?: (rowIndex: number) => void;
  editedRows?: Set<number>;
}

export function PreviewTable({ rows, onEdit, onDelete, editedRows }: PreviewTableProps) {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Filter rows by search — searches across ID, name, email, department
  const filteredRows = useMemo(() => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (row) =>
        row.name.toLowerCase().includes(q) ||
        row.employee_id.toLowerCase().includes(q) ||
        row.email.toLowerCase().includes(q) ||
        (row.department || '').toLowerCase().includes(q) ||
        (row.designation || '').toLowerCase().includes(q)
    );
  }, [rows, search]);

  // Pagination
  const totalPages = Math.ceil(filteredRows.length / rowsPerPage);
  const paginatedRows = useMemo(() => 
    filteredRows.slice(
      (currentPage - 1) * rowsPerPage,
      currentPage * rowsPerPage
    ),
    [filteredRows, currentPage]
  );

  // Stats
  const errorCount = rows.filter((r) => !r.isValid).length;
  const validCount = rows.filter((r) => r.isValid).length;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Search + Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, ID, email, department..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs">
            {validCount} valid
          </Badge>
          {errorCount > 0 && (
            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 text-xs">
              {errorCount} error{errorCount > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
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
                {(onEdit || onDelete) && (
                  <TableHead className="text-center font-semibold">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRows.map((row) => {
                const wasEdited = editedRows?.has(row.rowIndex);

                return (
                  <TableRow
                    key={row.rowIndex}
                    className={`transition-all duration-500 ${
                      wasEdited
                        ? 'bg-emerald-500/10 animate-pulse'
                        : !row.isValid
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
                    <TableCell className="font-medium">
                      {row.name || (
                        <span className="text-destructive italic">Missing</span>
                      )}
                    </TableCell>
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
                        wasEdited ? (
                          <Badge
                            variant="outline"
                            className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs"
                          >
                            ✓ Fixed
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs"
                          >
                            Valid
                          </Badge>
                        )
                      ) : (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge
                                variant="outline"
                                className="bg-destructive/10 text-destructive border-destructive/30 text-xs cursor-help"
                              >
                                <AlertCircle className="h-3 w-3 mr-1" />
                                {row.errors.length} error{row.errors.length > 1 ? 's' : ''}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="max-w-xs">
                              <ul className="text-xs space-y-1">
                                {row.errors.map((e, i) => (
                                  <li key={i} className="flex gap-1">
                                    <span className="text-destructive">•</span>
                                    <span>{e.message}</span>
                                  </li>
                                ))}
                              </ul>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </TableCell>
                    {(onEdit || onDelete) && (
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          {onEdit && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-primary"
                              onClick={() => onEdit(row.rowIndex)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {onDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => onDelete(row.rowIndex)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
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
