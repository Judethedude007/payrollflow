'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';
import type { ValidationResult } from '@/types';

interface ValidationSummaryProps {
  result: ValidationResult;
}

export function ValidationSummary({ result }: ValidationSummaryProps) {
  const hasErrors = result.errorCount > 0;

  return (
    <div className="animate-fade-in space-y-3">
      {/* Main summary */}
      <div
        className={`rounded-lg border p-4 flex items-center gap-3 ${
          hasErrors
            ? 'border-amber-500/30 bg-amber-500/5'
            : 'border-emerald-500/30 bg-emerald-500/5'
        }`}
      >
        {hasErrors ? (
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
        ) : (
          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
        )}
        <div>
          <p className="font-semibold text-sm">
            {hasErrors
              ? `${result.validCount} valid rows, ${result.errorCount} rows with errors`
              : `All ${result.totalRows} rows validated successfully`}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {hasErrors
              ? 'Fix the errors below or proceed with valid rows only'
              : 'Ready to save to database and generate salary slips'}
          </p>
        </div>
      </div>

      {/* Error details */}
      {hasErrors && result.errors.filter((e) => e.severity === 'error').length > 0 && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <p className="text-sm font-medium text-destructive">
              Errors ({result.errors.filter((e) => e.severity === 'error').length})
            </p>
          </div>
          <ul className="space-y-1 max-h-32 overflow-y-auto">
            {result.errors
              .filter((e) => e.severity === 'error')
              .slice(0, 10)
              .map((error, i) => (
                <li
                  key={i}
                  className="text-xs text-muted-foreground flex items-start gap-2"
                >
                  <span className="text-destructive font-mono shrink-0">
                    Row {error.rowIndex}:
                  </span>
                  <span>{error.message}</span>
                </li>
              ))}
            {result.errors.filter((e) => e.severity === 'error').length > 10 && (
              <li className="text-xs text-muted-foreground italic">
                ...and {result.errors.filter((e) => e.severity === 'error').length - 10} more errors
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
