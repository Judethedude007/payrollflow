'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { usePathname } from 'next/navigation';
import { Moon, Sun, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface HeaderProps {
  sidebarCollapsed: boolean;
  onMenuToggle: () => void;
}

const pageTitles: Record<string, { title: string; description: string }> = {
  '/dashboard': {
    title: 'Dashboard',
    description: 'Overview of your payroll operations',
  },
  '/upload': {
    title: 'Upload Payroll',
    description: 'Upload and process employee salary data',
  },
  '/records': {
    title: 'Salary Records',
    description: 'View and manage generated salary slips',
  },
  '/emails': {
    title: 'Email Logs',
    description: 'Track email delivery status',
  },
};

export function Header({ sidebarCollapsed, onMenuToggle }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const pageInfo = pageTitles[pathname] || {
    title: 'PayrollFlow',
    description: '',
  };

  return (
    <header
      className={`sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 backdrop-blur-md px-6 transition-all duration-300 ${
        sidebarCollapsed ? 'ml-[68px]' : 'ml-[260px]'
      }`}
    >
      <div className="flex items-center gap-4">
        {/* Mobile menu toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuToggle}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            {pageInfo.title}
          </h2>
          {pageInfo.description && (
            <p className="text-sm text-muted-foreground">
              {pageInfo.description}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="rounded-full"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* User Avatar */}
        <Avatar className="h-8 w-8 cursor-pointer ring-2 ring-primary/20 transition-all hover:ring-primary/50">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
            AD
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
