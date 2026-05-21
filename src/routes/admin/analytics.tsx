import { createFileRoute } from '@tanstack/react-router';
import { useMemo } from 'react';
import { Users, Crown, UserCircle, Activity, Calendar } from 'lucide-react';
import { AdminShell } from './-admin-shell';
import { StatCard } from './-admin-components';
import { MOCK_ANALYTICS, formatInt } from './-mock';

export const Route = createFileRoute('/admin/analytics')({
  component: AdminAnalyticsPage,
});

function AdminAnalyticsPage() {
  const premiumPct = useMemo(() => {
    const p = (MOCK_ANALYTICS.premiumUsers / MOCK_ANALYTICS.totalUsers) * 100;
    return `${p.toFixed(1)}%`;
  }, []);

  return (
    <AdminShell
      title="Analytics"
      description="High-level app metrics and usage."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          icon={Users}
          label="Total users"
          value={formatInt(MOCK_ANALYTICS.totalUsers)}
          hint="All registered accounts"
        />
        <StatCard
          icon={Crown}
          label="Premium"
          value={formatInt(MOCK_ANALYTICS.premiumUsers)}
          hint={`${premiumPct} of total`}
          accent="amber"
        />
        <StatCard
          icon={UserCircle}
          label="Basic"
          value={formatInt(MOCK_ANALYTICS.basicUsers)}
          hint="Free tier"
        />
        <StatCard
          icon={Activity}
          label="Active (7d)"
          value={formatInt(MOCK_ANALYTICS.activeLast7d)}
          hint="Signed in recently"
          accent="primary"
        />
        <StatCard
          icon={Calendar}
          label="New this month"
          value={formatInt(MOCK_ANALYTICS.newThisMonth)}
          hint="Registrations"
        />
      </div>

      <div className="mt-8 rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
        <p className="text-sm font-medium text-muted-foreground">Chart placeholder</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Wire charts (e.g. signups over time) when analytics API is available.
        </p>
      </div>
    </AdminShell>
  );
}
