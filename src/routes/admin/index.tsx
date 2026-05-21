import { createFileRoute, Link } from '@tanstack/react-router';
import { BarChart3, Users, UserCircle, ArrowRight, KeyRound } from 'lucide-react';
import { AdminShell } from './-admin-shell';

export const Route = createFileRoute('/admin/')({
  component: AdminOverview,
});

function AdminOverview() {
  return (
    <AdminShell
      title="Overview"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          to="/admin/analytics"
          className="group rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="rounded-lg border border-border bg-muted/50 p-2.5">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </div>
          <h3 className="mt-4 font-semibold">Analytics</h3>
          <p className="mt-1 text-sm text-muted-foreground">User counts, plans, activity, and growth metrics.</p>
        </Link>

        <Link
          to="/admin/users"
          className="group rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="rounded-lg border border-border bg-muted/50 p-2.5">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </div>
          <h3 className="mt-4 font-semibold">Users</h3>
          <p className="mt-1 text-sm text-muted-foreground">Browse and filter the user directory.</p>
        </Link>

        <Link
          to="/admin/roles"
          className="group rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="rounded-lg border border-border bg-muted/50 p-2.5">
              <KeyRound className="h-5 w-5 text-primary" />
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </div>
          <h3 className="mt-4 font-semibold">Roles & permissions</h3>
          <p className="mt-1 text-sm text-muted-foreground">Role definitions and permission matrix.</p>
        </Link>

        <Link
          to="/admin/profile"
          className="group rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="rounded-lg border border-border bg-muted/50 p-2.5">
              <UserCircle className="h-5 w-5 text-primary" />
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </div>
          <h3 className="mt-4 font-semibold">Profile</h3>
          <p className="mt-1 text-sm text-muted-foreground">Admin account display name, email, and role.</p>
        </Link>
      </div>
    </AdminShell>
  );
}
