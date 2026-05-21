import { createFileRoute } from '@tanstack/react-router';
import { Separator } from '@/components/ui/separator';
import { UserDashboardShell } from './-user-dashboard-shell';

export const Route = createFileRoute('/dashboard/purchase-history')({
  component: PurchaseHistoryPage,
});

const MOCK_PURCHASES = [
  { id: '1', date: 'Apr 10, 2026', item: 'Monthly subscription', amount: '$0.00', status: 'Free' },
  { id: '2', date: 'Mar 10, 2026', item: 'Monthly subscription', amount: '$0.00', status: 'Free' },
  { id: '3', date: 'Feb 10, 2026', item: 'Monthly subscription', amount: '$0.00', status: 'Free' },
] as const;

function PurchaseHistoryPage() {
  return (
    <UserDashboardShell title="Purchase history">
      <section className="rounded-md border border-border bg-background">
        <div className="px-6 py-4">
          <div className="text-sm font-semibold">Purchases</div>
        </div>
        <Separator />

        <div className="px-6 py-3">
          <div className="grid grid-cols-12 gap-4 text-[11px] font-medium text-muted-foreground">
            <div className="col-span-3">Date</div>
            <div className="col-span-6">Item</div>
            <div className="col-span-2 text-right">Amount</div>
            <div className="col-span-1 text-right">Status</div>
          </div>
        </div>
        <Separator />

        <div className="px-6">
          {MOCK_PURCHASES.map((p, idx) => (
            <div key={p.id}>
              <div className="grid grid-cols-12 gap-4 py-3 text-sm">
                <div className="col-span-3 text-foreground">{p.date}</div>
                <div className="col-span-6 text-foreground">{p.item}</div>
                <div className="col-span-2 text-right text-foreground">{p.amount}</div>
                <div className="col-span-1 text-right text-muted-foreground">{p.status}</div>
              </div>
              {idx < MOCK_PURCHASES.length - 1 ? <Separator /> : null}
            </div>
          ))}
        </div>
      </section>
    </UserDashboardShell>
  );
}

