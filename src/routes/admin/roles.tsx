import { createFileRoute } from '@tanstack/react-router';
import { Check, Minus, Pencil, Shield, Trash2 } from 'lucide-react';
import { AdminShell } from './-admin-shell';
import { AdminIconButton } from './-admin-components';
import { MOCK_PERMISSION_DEFS, MOCK_ROLES, formatInt } from './-mock';
import { cn } from '@/shared/ui/cn';

export const Route = createFileRoute('/admin/roles')({
  component: AdminRolesPage,
});

function AdminRolesPage() {
  return (
    <AdminShell
      title="Roles & permissions"
      description="Which roles exist and what each can do. Mock matrix for UI — wire to your auth service later."
    >
      <section className="mb-10">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Roles</h3>
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3 font-medium text-muted-foreground">Role</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Description</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground tabular-nums">Members</th>
                  <th className="w-px px-2 py-3 font-medium text-muted-foreground whitespace-nowrap">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {MOCK_ROLES.map((role) => (
                  <tr key={role.id} className="border-b border-border/80 transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40">
                          <Shield className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium">{role.name}</span>
                      </div>
                    </td>
                    <td className="max-w-md px-4 py-3 text-muted-foreground">{role.description}</td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">
                      {formatInt(role.memberCount)}
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex items-center justify-end gap-0.5">
                        <AdminIconButton label="Edit role" icon={Pencil} />
                        <AdminIconButton label="Delete role" icon={Trash2} variant="destructive" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Permission matrix
        </h3>
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="sticky left-0 z-10 min-w-[200px] bg-muted/95 px-4 py-3 font-medium text-muted-foreground backdrop-blur-sm">
                    Permission
                  </th>
                  {MOCK_ROLES.map((r) => (
                    <th
                      key={r.id}
                      className="px-3 py-3 text-center text-xs font-medium text-muted-foreground whitespace-nowrap"
                    >
                      {r.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MOCK_PERMISSION_DEFS.map((perm) => (
                  <tr key={perm.id} className="border-b border-border/80">
                    <td className="sticky left-0 z-10 bg-card/95 px-4 py-2.5 font-medium backdrop-blur-sm">
                      {perm.label}
                      <span className="mt-0.5 block font-mono text-[10px] font-normal text-muted-foreground">
                        {perm.id}
                      </span>
                    </td>
                    {MOCK_ROLES.map((role) => {
                      const allowed = role.permissionIds.includes(perm.id);
                      return (
                        <td key={role.id} className="px-3 py-2.5 text-center">
                          <span
                            className={cn(
                              'inline-flex h-7 w-7 items-center justify-center rounded-md border',
                              allowed
                                ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-300'
                                : 'border-border/80 bg-muted/30 text-muted-foreground'
                            )}
                            title={allowed ? 'Allowed' : 'Denied'}
                          >
                            {allowed ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : <Minus className="h-3.5 w-3.5" />}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </AdminShell>
  );
}
