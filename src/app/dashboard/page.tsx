'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, FileText, Mail, Calendar, Upload, Download } from 'lucide-react';
import { StatCard } from '@/components/dashboard/stat-card';
import { Button } from '@/components/ui/button';
import { DashboardSkeleton } from '@/components/shared/loading-skeleton';
import type { DashboardStats } from '@/types';

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Auth check
    const isAuth = localStorage.getItem('payrollflow_auth');
    if (isAuth !== 'true') {
      router.replace('/login');
      return;
    }

    fetchStats();
  }, [router]);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <DashboardSkeleton />;

  const currentMonth = stats?.currentMonth || new Date().toLocaleString('default', { month: 'long' });
  const currentYear = stats?.currentYear || new Date().getFullYear().toString();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/10 p-6 lg:p-8">
        <h2 className="text-2xl font-bold tracking-tight mb-1">
          Good {getGreeting()}, Admin 👋
        </h2>
        <p className="text-muted-foreground">
          Here&apos;s your payroll overview for {currentMonth} {currentYear}.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <Button onClick={() => router.push('/upload')} className="gap-2">
            <Upload className="h-4 w-4" />
            Upload Payroll
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/records')}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            View Records
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
        <StatCard
          title="Total Employees"
          value={stats?.totalEmployees ?? 0}
          icon={Users}
          variant="blue"
          description="Registered in system"
          delay={0}
        />
        <StatCard
          title="Salary Slips Generated"
          value={stats?.salarySlipsGenerated ?? 0}
          icon={FileText}
          variant="emerald"
          description="This month"
          delay={100}
        />
        <StatCard
          title="Emails Sent"
          value={stats?.emailsSent ?? 0}
          icon={Mail}
          variant="amber"
          description="Successfully delivered"
          delay={200}
        />
        <StatCard
          title="Current Payroll"
          value={`${currentMonth.substring(0, 3)} ${currentYear}`}
          icon={Calendar}
          variant="violet"
          description="Active period"
          delay={300}
        />
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => router.push('/upload')}
            className="flex items-center gap-4 rounded-lg border bg-background p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-primary/30"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <Upload className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-left">
              <p className="font-medium text-sm">Upload Payroll</p>
              <p className="text-xs text-muted-foreground">
                Import Excel/CSV data
              </p>
            </div>
          </button>
          <button
            onClick={() => router.push('/records')}
            className="flex items-center gap-4 rounded-lg border bg-background p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-primary/30"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-left">
              <p className="font-medium text-sm">Salary Records</p>
              <p className="text-xs text-muted-foreground">
                View & download slips
              </p>
            </div>
          </button>
          <button
            onClick={() => router.push('/emails')}
            className="flex items-center gap-4 rounded-lg border bg-background p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-primary/30"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <Mail className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-left">
              <p className="font-medium text-sm">Email Status</p>
              <p className="text-xs text-muted-foreground">
                Track delivery logs
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
