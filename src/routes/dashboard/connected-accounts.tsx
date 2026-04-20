import { createFileRoute } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { UserDashboardShell } from './-user-dashboard-shell';

export const Route = createFileRoute('/dashboard/connected-accounts')({
  component: ConnectedAccountsPage,
});

const MOCK_ACCOUNTS = [
  { id: 'google', label: 'Google', status: 'Not connected' },
  { id: 'apple', label: 'Apple', status: 'Not connected' },
  { id: 'facebook', label: 'Facebook', status: 'Not connected' },
] as const;

function ConnectedAccountsPage() {
  return (
    <UserDashboardShell title="Connected Accounts">
      <section className="rounded-md border border-border bg-background">
        <div className="px-6 py-4">
          <div className="text-sm font-semibold">Connected Accounts</div>
          <p className="mt-1 text-xs text-muted-foreground">
            Connect accounts to make sign-in easier. Design-only preview.
          </p>
        </div>
        <Separator />
        <div className="px-6">
          {MOCK_ACCOUNTS.map((a, idx) => (
            <div key={a.id}>
              <div className="flex items-center justify-between gap-6 py-4">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground">{a.label}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{a.status}</div>
                </div>
                <Button type="button" size="sm" variant="outline" disabled className="opacity-70">
                  Connect
                </Button>
              </div>
              {idx < MOCK_ACCOUNTS.length - 1 ? <Separator /> : null}
            </div>
          ))}
        </div>
      </section>
    </UserDashboardShell>
  );
}

