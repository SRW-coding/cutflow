import { createFileRoute } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { UserDashboardShell } from './-user-dashboard-shell';

export const Route = createFileRoute('/dashboard/developers')({
  component: DevelopersPage,
});

function KeyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-6 py-3">
      <div className="min-w-0">
        <div className="text-[11px] font-medium text-muted-foreground">{label}</div>
        <div className="mt-1 truncate font-mono text-sm text-foreground">{value}</div>
      </div>
      <Button type="button" size="sm" variant="outline" disabled className="opacity-70">
        Copy
      </Button>
    </div>
  );
}

function DevelopersPage() {
  return (
    <UserDashboardShell title="Developers">
      <section className="rounded-md border border-border bg-background">
        <div className="px-6 py-4">
          <div className="text-sm font-semibold">API keys</div>
          <p className="mt-1 text-xs text-muted-foreground">
            Use API keys to authenticate requests. Design-only preview.
          </p>
        </div>
        <Separator />
        <div className="px-6">
          <KeyRow label="Public key" value="pk_live_************************" />
          <Separator />
          <KeyRow label="Secret key" value="sk_live_************************" />
        </div>
        <Separator />
        <div className="flex flex-wrap gap-2 px-6 py-4">
          <Button type="button" size="sm" disabled className="opacity-70">
            Create new key
          </Button>
          <Button type="button" size="sm" variant="outline" disabled className="opacity-70">
            Revoke key
          </Button>
        </div>
      </section>

      <div className="h-8" />

      <section className="rounded-md border border-border bg-background">
        <div className="px-6 py-4">
          <div className="text-sm font-semibold">Webhooks</div>
          <p className="mt-1 text-xs text-muted-foreground">
            Send events to your server when things happen. Design-only preview.
          </p>
        </div>
        <Separator />
        <div className="px-6 py-4 text-sm text-muted-foreground">No webhook endpoints configured.</div>
        <Separator />
        <div className="px-6 py-4">
          <Button type="button" size="sm" variant="outline" disabled className="opacity-70">
            Add endpoint
          </Button>
        </div>
      </section>
    </UserDashboardShell>
  );
}

