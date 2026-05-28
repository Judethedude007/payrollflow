'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Save,
  FileText,
  Mail,
  Download,
  Loader2,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FileDropzone } from '@/components/upload/file-dropzone';
import { PreviewTable } from '@/components/upload/preview-table';
import { ValidationSummary } from '@/components/upload/validation-summary';
import { EmptyState } from '@/components/shared/empty-state';
import { parseExcelFile } from '@/utils/parser';
import { validatePayrollData } from '@/utils/validation';
import type { PayrollRow, ValidationResult } from '@/types';

type Step = 'upload' | 'preview' | 'actions';

export default function UploadPage() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<PayrollRow[]>([]);
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [savedToDb, setSavedToDb] = useState(false);

  useEffect(() => {
    const isAuth = localStorage.getItem('payrollflow_auth');
    if (isAuth !== 'true') {
      router.replace('/login');
    }
  }, [router]);

  const handleFileAccepted = async (file: File) => {
    setSelectedFile(file);
    setIsProcessing(true);

    try {
      const buffer = await file.arrayBuffer();
      const rows = parseExcelFile(buffer);

      if (rows.length === 0) {
        toast.error('No data found', {
          description: 'The uploaded file appears to be empty.',
        });
        setSelectedFile(null);
        setIsProcessing(false);
        return;
      }

      const result = validatePayrollData(rows);
      setParsedRows([...result.validRows, ...result.invalidRows]);
      setValidationResult(result);
      setCurrentStep('preview');

      if (result.errorCount > 0) {
        toast.warning(`${result.errorCount} rows have validation errors`, {
          description: 'Review the errors below before proceeding.',
        });
      } else {
        toast.success(`${result.totalRows} rows parsed successfully`, {
          description: 'All data is valid and ready to process.',
        });
      }
    } catch (error) {
      toast.error('Failed to parse file', {
        description:
          error instanceof Error
            ? error.message
            : 'Please check the file format and try again.',
      });
      setSelectedFile(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setParsedRows([]);
    setValidationResult(null);
    setCurrentStep('upload');
    setSavedToDb(false);
  };

  const handleSaveToDatabase = async () => {
    if (!validationResult) return;

    const validRows = validationResult.validRows;
    if (validRows.length === 0) {
      toast.error('No valid rows to save');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: validRows }),
      });

      const data = await res.json();

      if (data.success) {
        setSavedToDb(true);
        setCurrentStep('actions');
        toast.success('Data saved successfully!', {
          description: data.message,
        });
      } else {
        toast.error('Failed to save data', {
          description: data.error,
        });
      }
    } catch (error) {
      toast.error('Network error', {
        description: 'Failed to connect to the server.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGeneratePdfs = async () => {
    if (!validationResult) return;

    const validRows = validationResult.validRows;
    if (validRows.length === 0) return;

    setIsGenerating(true);
    try {
      const month = validRows[0].month;
      const year = validRows[0].year;
      const employeeIds = validRows.map((r) => r.employee_id);

      const res = await fetch('/api/salary/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeIds, month, year }),
      });

      const data = await res.json();

      if (data.success && data.data.pdfs.length > 0) {
        // Download each PDF
        for (const pdf of data.data.pdfs) {
          const link = document.createElement('a');
          link.href = `data:application/pdf;base64,${pdf.pdf}`;
          link.download = `SalarySlip_${pdf.name.replace(/\s+/g, '_')}.pdf`;
          link.click();
        }

        toast.success(`${data.data.generated} salary slips generated!`, {
          description: 'PDFs have been downloaded.',
        });
      } else {
        toast.error('Failed to generate PDFs', {
          description: data.message || data.error || 'No PDFs were generated.',
        });
        console.error('PDF Generate response:', data);
      }
    } catch (error) {
      toast.error('Generation failed', {
        description: 'Failed to generate salary slips.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendEmails = async () => {
    if (!validationResult) return;

    const validRows = validationResult.validRows;
    if (validRows.length === 0) return;

    setIsSending(true);
    try {
      const month = validRows[0].month;
      const year = validRows[0].year;
      const employeeIds = validRows.map((r) => r.employee_id);

      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeIds, month, year }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(`${data.data.sent} emails sent successfully!`, {
          description:
            data.data.failed > 0
              ? `${data.data.failed} emails failed to send.`
              : 'All salary slips delivered.',
        });
      } else {
        toast.error('Email sending failed', {
          description: data.error,
        });
      }
    } catch (error) {
      toast.error('Network error', {
        description: 'Failed to send emails.',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleDownloadAll = async () => {
    if (!validationResult) return;

    const validRows = validationResult.validRows;
    if (validRows.length === 0) return;

    setIsDownloading(true);
    try {
      const month = validRows[0].month;
      const year = validRows[0].year;

      const res = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month, year }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `SalarySlips_${month}_${year}.zip`;
        link.click();
        URL.revokeObjectURL(url);

        toast.success('ZIP downloaded!', {
          description: 'All salary slips packaged and downloaded.',
        });
      } else {
        const data = await res.json();
        toast.error('Download failed', {
          description: data.error || 'Failed to generate ZIP file.',
        });
      }
    } catch (error) {
      toast.error('Download failed', {
        description: 'Network error while downloading.',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Step Indicator */}
      <div className="flex items-center gap-3">
        {[
          { key: 'upload', label: 'Upload File' },
          { key: 'preview', label: 'Preview & Validate' },
          { key: 'actions', label: 'Process' },
        ].map((step, i) => (
          <React.Fragment key={step.key}>
            <div className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                  currentStep === step.key
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                    : parsedRows.length > 0 &&
                      (step.key === 'upload' ||
                        (step.key === 'preview' && savedToDb))
                    ? 'bg-emerald-500 text-white'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {parsedRows.length > 0 &&
                (step.key === 'upload' ||
                  (step.key === 'preview' && savedToDb)) ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`text-sm font-medium hidden sm:block ${
                  currentStep === step.key
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < 2 && (
              <ArrowRight className="h-4 w-4 text-muted-foreground/40" />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Upload Section */}
      <FileDropzone
        onFileAccepted={handleFileAccepted}
        selectedFile={selectedFile}
        onClear={handleClearFile}
        isProcessing={isProcessing}
      />

      {/* Processing indicator */}
      {isProcessing && (
        <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/30 animate-fade-in">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <div>
            <p className="text-sm font-medium">Processing file...</p>
            <p className="text-xs text-muted-foreground">
              Parsing and validating your payroll data
            </p>
          </div>
        </div>
      )}

      {/* Validation Summary */}
      {validationResult && <ValidationSummary result={validationResult} />}

      {/* Preview Table */}
      {parsedRows.length > 0 && <PreviewTable rows={parsedRows} />}

      {/* Action Buttons */}
      {parsedRows.length > 0 && (
        <div className="flex flex-wrap gap-3 rounded-xl border bg-card p-4 animate-slide-up">
          {!savedToDb ? (
            <Button
              onClick={handleSaveToDatabase}
              disabled={
                isSaving || !validationResult || validationResult.validCount === 0
              }
              className="gap-2"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isSaving ? 'Saving...' : 'Save to Database'}
            </Button>
          ) : (
            <>
              <Button
                onClick={handleGeneratePdfs}
                disabled={isGenerating}
                variant="outline"
                className="gap-2"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                {isGenerating ? 'Generating...' : 'Generate PDFs'}
              </Button>

              <Button
                onClick={handleSendEmails}
                disabled={isSending}
                className="gap-2"
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
                {isSending ? 'Sending...' : 'Send Emails'}
              </Button>

              <Button
                onClick={handleDownloadAll}
                disabled={isDownloading}
                variant="outline"
                className="gap-2"
              >
                {isDownloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {isDownloading ? 'Downloading...' : 'Download All (ZIP)'}
              </Button>
            </>
          )}
        </div>
      )}

      {/* Empty state */}
      {!selectedFile && parsedRows.length === 0 && !isProcessing && (
        <EmptyState
          icon="file"
          title="No payroll data uploaded yet"
          description="Upload an Excel or CSV file with employee salary information to get started."
        />
      )}
    </div>
  );
}
