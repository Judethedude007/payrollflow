'use client';

import React from 'react';
import { FileX, Inbox, MailX, DatabaseZap } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: 'file' | 'inbox' | 'mail' | 'database';
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

const icons = {
  file: FileX,
  inbox: Inbox,
  mail: MailX,
  database: DatabaseZap,
};

export function EmptyState({
  icon = 'inbox',
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const Icon = icons[icon];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 animate-fade-in">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted/60 mb-6">
        <Icon className="h-10 w-10 text-muted-foreground/60" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="animate-pulse-glow">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
