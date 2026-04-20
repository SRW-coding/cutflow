import { createFileRoute } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { UserDashboardShell } from './-user-dashboard-shell';

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

function PlansPage() {
  return (
    <UserDashboardShell title="Plans">
      <section className="rounded-md border border-border bg-background">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="text-sm font-semibold">Current plan</div>
          <Button type="button" size="sm" variant="outline" disabled className="opacity-70">
            Manage plan
          </Button>
        </div>
        <Separator />
        <div className="px-6">
          <InfoRow label="Plan" value="Free (mock)" />
          <Separator />
          <InfoRow label="Status" value="Active" />
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

