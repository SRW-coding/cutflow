import { createFileRoute } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { UserDashboardShell } from './-user-dashboard-shell';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/shared/ui/cn';

export const Route = createFileRoute('/dashboard/plans')({
  component: PlansPage,
});

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-6 py-3">
      <div className="min-w-0">
        <div className="text-[11px] font-medium text-muted-foreground">{label}</div>
        <div className="mt-1 truncate text-sm text-foreground">{value}</div>
      </div>
    </div>
  );
}

function PlanBadge({ name, status }: { name: string; status: string }) {
  const isPaid = name.toLowerCase() !== 'free';
  const isActive = status.toLowerCase() === 'active';
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold',
        isPaid
          ? 'bg-primary/15 text-primary ring-1 ring-primary/30'
          : 'bg-muted text-muted-foreground ring-1 ring-border'
      )}>
        {name}
      </span>
      <span className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        isActive
          ? 'bg-emerald-500/15 text-emerald-600 ring-1 ring-emerald-500/25 dark:text-emerald-400'
          : 'bg-amber-500/15 text-amber-600 ring-1 ring-amber-500/25 dark:text-amber-400'
      )}>
        {status}
      </span>
    </div>
  );
}

function PlansPage() {
  const user = useAuthStore((s) => s.user);
  const planName = user?.subscription?.plan?.name ?? 'Free';
  const planStatus = user?.subscription?.status ?? 'Active';

  return (
    <UserDashboardShell title="Plans">
      <section className="rounded-md border border-border bg-background">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <div className="text-sm font-semibold">Current plan</div>
            <div className="mt-2">
              <PlanBadge name={planName} status={planStatus} />
            </div>
          </div>
          <Button type="button" size="sm" variant="outline" disabled className="opacity-70">
            Manage plan
          </Button>
        </div>
        <Separator />
        <div className="px-6">
          <InfoRow label="Plan" value={planName} />
          <Separator />
          <InfoRow label="Status" value={planStatus} />
          <Separator />
          <InfoRow label="Renewal" value="Renews monthly — Apr 30, 2026" />
          <Separator />
          <InfoRow label="Payment method" value="Not added" />
        </div>
      </section>

      <div className="h-8" />

      <section className="rounded-md border border-border bg-background">
        <div className="px-6 py-4">
          <div className="text-sm font-semibold">Billing</div>
          <p className="mt-1 text-xs text-muted-foreground">Design-only preview. Billing actions are disabled.</p>
        </div>
        <Separator />
        <div className="flex flex-wrap gap-2 px-6 py-4">
          <Button type="button" size="sm" disabled className="opacity-70">
            Update payment method
          </Button>
          <Button type="button" size="sm" variant="outline" disabled className="opacity-70">
            Download invoices
          </Button>
          <Button type="button" size="sm" variant="outline" disabled className="opacity-70">
            Cancel plan
          </Button>
        </div>
      </section>
    </UserDashboardShell>
  );
}

