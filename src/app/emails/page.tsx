'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/shared/empty-state';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import {
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Loader2,
  TrendingUp,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface EmailLogEntry {
  id: number;
  employee_id: string;
  status: string;
  error_message: string | null;
  sent_at: string;
  employees?: {
    name: string;
    email: string;
  };
}

const statusConfig: Record<string, { icon: React.ReactNode; className: string; label: string }> = {
  sent: {
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    label: 'Sent',
  },
  failed: {
    icon: <XCircle className="h-3.5 w-3.5" />,
    className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30',
    label: 'Failed',
  },
  pending: {
    icon: <Clock className="h-3.5 w-3.5" />,
    className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    label: 'Pending',
  },
};

export default function EmailsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<EmailLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [isRetryingAll, setIsRetryingAll] = useState(false);

  useEffect(() => {
    const isAuth = localStorage.getItem('payrollflow_auth');
    if (isAuth !== 'true') {
      router.replace('/login');
      return;
    }
    fetchLogs();
  }, [router]);

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('email_logs')
        .select(`
          *,
          employees (name, email)
        `)
        .order('sent_at', { ascending: false });

      if (error) throw error;
      setLogs((data as EmailLogEntry[]) || []);
    } catch (error) {
      console.error('Failed to fetch email logs:', error);
      toast.error('Failed to load email logs');
    } finally {
      setIsLoading(false);
    }
  };

  // Memoized filtering
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !search ||
        log.employee_id.toLowerCase().includes(q) ||
        log.employees?.name?.toLowerCase().includes(q) ||
        log.employees?.email?.toLowerCase().includes(q) ||
        (log.error_message || '').toLowerCase().includes(q);
      const matchesStatus =
        filterStatus === 'all' || log.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [logs, search, filterStatus]);

  // Stats
  const sentCount = useMemo(() => logs.filter((l) => l.status === 'sent').length, [logs]);
  const failedCount = useMemo(() => logs.filter((l) => l.status === 'failed').length, [logs]);
  const pendingCount = useMemo(() => logs.filter((l) => l.status === 'pending').length, [logs]);
  const deliveryRate = useMemo(() => {
    const total = sentCount + failedCount;
    return total > 0 ? Math.round((sentCount / total) * 100) : 0;
  }, [sentCount, failedCount]);

  // Retry single email
  const handleRetry = useCallback(async (log: EmailLogEntry) => {
    setRetryingId(log.employee_id);
    try {
      const res = await fetch('/api/email/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: log.employee_id,
          month: 'June', // TODO: extract from log context
          year: '2026',
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Email resent successfully', {
          description: data.message,
        });
        await fetchLogs(); // Refresh
      } else {
        toast.error('Retry failed', {
          description: data.error,
        });
      }
    } catch {
      toast.error('Network error', {
        description: 'Failed to retry email.',
      });
    } finally {
      setRetryingId(null);
    }
  }, []);

  // Retry all failed
  const handleRetryAllFailed = useCallback(async () => {
    const failedLogs = logs.filter((l) => l.status === 'failed');
    if (failedLogs.length === 0) {
      toast.info('No failed emails to retry');
      return;
    }

    setIsRetryingAll(true);
    let successCount = 0;
    let failCount = 0;

    for (const log of failedLogs) {
      try {
        const res = await fetch('/api/email/retry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employeeId: log.employee_id,
            month: 'June',
            year: '2026',
          }),
        });

        const data = await res.json();
        if (data.success) successCount++;
        else failCount++;
      } catch {
        failCount++;
      }
    }

    toast.success(`Bulk retry complete`, {
      description: `${successCount} resent, ${failCount} still failed.`,
    });

    await fetchLogs();
    setIsRetryingAll(false);
  }, [logs]);

  if (isLoading) return <TableSkeleton rows={8} />;

  if (logs.length === 0) {
    return (
      <EmptyState
        icon="mail"
        title="No emails sent yet"
        description="Upload payroll data and send salary slips via email to see delivery logs here."
        actionLabel="Upload Payroll"
        onAction={() => router.push('/upload')}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-lg border bg-card p-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">{sentCount}</p>
            <p className="text-xs text-muted-foreground">Sent</p>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10">
            <XCircle className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">{failedCount}</p>
            <p className="text-xs text-muted-foreground">Failed</p>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
            <Clock className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">{pendingCount}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
            <TrendingUp className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">{deliveryRate}%</p>
            <p className="text-xs text-muted-foreground">Delivery Rate</p>
          </div>
        </div>
      </div>

      {/* Filters + Retry All */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by employee or error..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'sent', 'failed', 'pending'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  filterStatus === status
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {failedCount > 0 && (
          <Button
            onClick={handleRetryAllFailed}
            disabled={isRetryingAll}
            variant="outline"
            size="sm"
            className="gap-2 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 dark:text-red-400 dark:border-red-800"
          >
            {isRetryingAll ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            {isRetryingAll ? 'Retrying...' : `Retry All Failed (${failedCount})`}
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-semibold">Employee</TableHead>
                <TableHead className="font-semibold hidden md:table-cell">Email</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold hidden md:table-cell">Error</TableHead>
                <TableHead className="font-semibold hidden md:table-cell">Sent At</TableHead>
                <TableHead className="text-center font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => {
                const config = statusConfig[log.status] || statusConfig.pending;
                const isRetrying = retryingId === log.employee_id;

                return (
                  <TableRow key={log.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">
                          {log.employees?.name || log.employee_id}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {log.employee_id}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
                      {log.employees?.email || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`gap-1 text-xs ${config.className}`}
                      >
                        {config.icon}
                        {config.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] hidden md:table-cell">
                      {log.error_message ? (
                        <span className="text-red-500 text-xs break-words">
                          {log.error_message}
                        </span>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap hidden md:table-cell">
                      {log.sent_at
                        ? new Date(log.sent_at).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })
                        : '—'}
                    </TableCell>
                    <TableCell className="text-center">
                      {log.status === 'failed' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRetry(log)}
                          disabled={isRetrying || isRetryingAll}
                          className="gap-1.5 text-xs"
                        >
                          {isRetrying ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3 w-3" />
                          )}
                          {isRetrying ? 'Retrying...' : 'Retry'}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
