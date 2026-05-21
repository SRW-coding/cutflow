import type { ComponentType } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Crown, UserCircle } from 'lucide-react';
import { cn } from '@/shared/ui/cn';

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint: string;
  accent?: 'amber' | 'primary';
}) {
  const ring =
    accent === 'amber'
      ? 'border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent'
      : accent === 'primary'
        ? 'border-primary/25 bg-gradient-to-br from-primary/10 to-transparent'
        : 'border-border bg-card';

  return (
    <div className={`rounded-xl border p-4 shadow-sm ${ring}`}>
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

export function PlanBadge({ plan }: { plan: 'premium' | 'basic' }) {
  if (plan === 'premium') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-200">
        <Crown className="h-3 w-3" />
        Premium
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
      <UserCircle className="h-3 w-3" />
      Basic
    </span>
  );
}

export function StatusBadge({ status }: { status: 'active' | 'inactive' | 'suspended' }) {
  const styles = {
    active: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
    inactive: 'border-border bg-muted/50 text-muted-foreground',
    suspended: 'border-destructive/30 bg-destructive/10 text-destructive',
  } as const;
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${styles[status]}`}>
      {status}
    </span>
  );
}

/** Icon-only row action for admin tables. */
export function AdminIconButton({
  label,
  icon: Icon,
  variant = 'default',
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  variant?: 'default' | 'destructive';
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={cn(
        'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors',
        'hover:bg-muted hover:text-foreground',
        variant === 'destructive' && 'hover:border-destructive/40 hover:text-destructive'
      )}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={2} />
    </button>
  );
}
