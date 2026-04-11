import type { ComponentType } from 'react';
import { cn } from '@/shared/ui/cn';

export function DashboardStatCard({
  icon: Icon,
  label,
  value,
  hint,
  accent = 'default',
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint: string;
  accent?: 'default' | 'primary' | 'amber';
}) {
  const ring =
    accent === 'amber'
      ? 'border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent'
      : accent === 'primary'
        ? 'border-primary/25 bg-gradient-to-br from-primary/10 to-transparent'
        : 'border-border bg-card';

  return (
    <div className={cn('rounded-xl border p-4 shadow-sm', ring)}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>
        </div>
        <div className="rounded-lg border border-border/80 bg-muted/50 p-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}
