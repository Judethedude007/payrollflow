'use client';

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface FileDropzoneProps {
  onFileAccepted: (file: File) => void;
  selectedFile: File | null;
  onClear: () => void;
  isProcessing: boolean;
}

export function FileDropzone({
  onFileAccepted,
  selectedFile,
  onClear,
  isProcessing,
}: FileDropzoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileAccepted(acceptedFiles[0]);
      }
    },
    [onFileAccepted]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      accept: {
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
        'application/vnd.ms-excel': ['.xls'],
        'text/csv': ['.csv'],
      },
      maxFiles: 1,
      disabled: isProcessing,
    });

  if (selectedFile) {
    return (
      <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <FileSpreadsheet className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {(selectedFile.size / 1024).toFixed(1)} KB •{' '}
                {selectedFile.type || 'spreadsheet'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClear}
            disabled={isProcessing}
            className="text-muted-foreground hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        'rounded-xl border-2 border-dashed p-12 text-center cursor-pointer transition-all duration-300',
        isDragActive && !isDragReject
          ? 'border-primary bg-primary/5 scale-[1.02]'
          : isDragReject
          ? 'border-destructive bg-destructive/5'
          : 'border-border hover:border-primary/50 hover:bg-muted/30'
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-4">
        <div
          className={cn(
            'flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-300',
            isDragActive
              ? 'bg-primary/20 scale-110'
              : 'bg-muted'
          )}
        >
          <Upload
            className={cn(
              'h-8 w-8 transition-colors',
              isDragActive ? 'text-primary' : 'text-muted-foreground'
            )}
          />
        </div>
        <div>
          <p className="text-lg font-semibold mb-1">
            {isDragActive
              ? 'Drop your file here'
              : 'Drag & drop your payroll file'}
          </p>
          <p className="text-sm text-muted-foreground">
            or{' '}
            <span className="text-primary font-medium cursor-pointer hover:underline">
              browse files
            </span>
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Supports .xlsx, .xls, and .csv files
          </p>
        </div>
      </div>
    </div>
  );
}
