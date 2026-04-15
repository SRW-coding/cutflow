import { createFileRoute } from '@tanstack/react-router';
import { KeyRound, Mail, Pencil, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AdminShell } from './-admin-shell';
import { AdminIconButton, PlanBadge, StatusBadge } from './-admin-components';
import { MOCK_ANALYTICS, MOCK_USERS, formatInt } from './-mock';

export const Route = createFileRoute('/admin/users')({
  component: AdminUsersPage,
});

function AdminUsersPage() {
  return (
    <AdminShell
      title="Users"
      description="Directory of accounts. Table is populated with mock rows only."
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <div className="relative max-w-sm flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search users…" className="h-9 pl-9" readOnly />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 font-medium text-muted-foreground">User</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Plan</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Joined</th>
                <th className="w-px px-2 py-3 text-right font-medium text-muted-foreground whitespace-nowrap">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {MOCK_USERS.map((u) => (
                <tr key={u.id} className="border-b border-border/80 transition-colors hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary text-xs font-medium text-secondary-foreground">
                        {u.name
                          .split(' ')
                          .map((p) => p[0])
                          .join('')
                          .slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium">{u.name}</div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3 shrink-0" />
                          <span className="truncate">{u.email}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <PlanBadge plan={u.plan} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={u.status} />
                  </td>
                  <td className="px-4 py-3 tabular-nums text-muted-foreground">{u.joined}</td>
                  <td className="px-2 py-2">
                    <div className="flex items-center justify-end gap-0.5">
                      <AdminIconButton label="Edit user" icon={Pencil} />
                      <AdminIconButton label="Roles & permissions" icon={KeyRound} />
                      <AdminIconButton label="Delete user" icon={Trash2} variant="destructive" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
          <span>
            Showing {MOCK_USERS.length} of {formatInt(MOCK_ANALYTICS.totalUsers)} (mock)
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled className="h-8 opacity-60">
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled className="h-8 opacity-60">
              Next
            </Button>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
