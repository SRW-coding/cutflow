import { createFileRoute } from '@tanstack/react-router';
import { Check, Minus, Pencil, Shield, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { AdminShell } from './-admin-shell';
import { AdminIconButton } from './-admin-components';
import { MOCK_PERMISSION_DEFS, MOCK_ROLES, formatInt, type MockRoleRow } from './-mock';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/shared/ui/cn';

export const Route = createFileRoute('/admin/roles')({
  component: AdminRolesPage,
});

function AdminRolesPage() {
  const [editRoleOpen, setEditRoleOpen] = useState(false);
  const [deleteRoleOpen, setDeleteRoleOpen] = useState(false);
  const [permOpen, setPermOpen] = useState(false);

  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [selectedPermId, setSelectedPermId] = useState<string | null>(null);

  const selectedRole = useMemo(
    () => (selectedRoleId ? MOCK_ROLES.find((r) => r.id === selectedRoleId) : undefined),
    [selectedRoleId]
  );
  const selectedPerm = useMemo(
    () => (selectedPermId ? MOCK_PERMISSION_DEFS.find((p) => p.id === selectedPermId) : undefined),
    [selectedPermId]
  );

  function openEditRole(role: MockRoleRow) {
    setSelectedRoleId(role.id);
    setEditRoleOpen(true);
  }

  function openDeleteRole(role: MockRoleRow) {
    setSelectedRoleId(role.id);
    setDeleteRoleOpen(true);
  }

  function openPerm(role: MockRoleRow, permId: string) {
    setSelectedRoleId(role.id);
    setSelectedPermId(permId);
    setPermOpen(true);
  }

  return (
    <AdminShell
      title="Roles & permissions"
      description="Which roles exist and what each can do."
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
                        <AdminIconButton label="Edit role" icon={Pencil} onClick={() => openEditRole(role)} />
                        <AdminIconButton
                          label="Delete role"
                          icon={Trash2}
                          variant="destructive"
                          onClick={() => openDeleteRole(role)}
                        />
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
                          <button
                            type="button"
                            onClick={() => openPerm(role, perm.id)}
                            className={cn(
                              'inline-flex h-7 w-7 items-center justify-center rounded-md border transition-colors',
                              'hover:bg-muted/40',
                              allowed
                                ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-300'
                                : 'border-border/80 bg-muted/30 text-muted-foreground'
                            )}
                            title={`${allowed ? 'Allowed' : 'Denied'}: ${perm.label}`}
                          >
                            {allowed ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : <Minus className="h-3.5 w-3.5" />}
                          </button>
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

      <Dialog open={editRoleOpen} onOpenChange={setEditRoleOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit role</DialogTitle>
            <DialogDescription>Update role details and permissions.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <div className="text-xs font-medium text-muted-foreground">Role</div>
              <div className="mt-1 text-base font-semibold">{selectedRole?.name ?? '—'}</div>
              <div className="mt-1 text-sm text-muted-foreground">{selectedRole?.description ?? '—'}</div>
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>Members</span>
                <span className="font-medium tabular-nums">{formatInt(selectedRole?.memberCount ?? 0)}</span>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card">
              <div className="border-b border-border px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Permissions
              </div>
              <div className="max-h-[280px] overflow-auto p-4 space-y-2">
                {MOCK_PERMISSION_DEFS.map((p) => {
                  const allowed = selectedRole?.permissionIds.includes(p.id) ?? false;
                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-lg border border-border/80 bg-muted/20 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium">{p.label}</div>
                        <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">{p.id}</div>
                      </div>
                      <span
                        className={cn(
                          'shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-medium',
                          allowed
                            ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-200'
                            : 'border-border bg-background text-muted-foreground'
                        )}
                      >
                        {allowed ? 'Allowed' : 'Denied'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRoleOpen(false)}>
              Close
            </Button>
            <Button disabled className="opacity-60">
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteRoleOpen} onOpenChange={setDeleteRoleOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete role</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedRole ? (
                <span className="mt-2 block">
                  You’re about to delete <span className="font-medium">{selectedRole.name}</span>.
                </span>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => setDeleteRoleOpen(false)}
            >
              Delete role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={permOpen} onOpenChange={setPermOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Permission details</DialogTitle>
            <DialogDescription>
              Access for <span className="font-medium">{selectedRole?.name ?? 'role'}</span> —{' '}
              <span className="font-mono text-[12px]">{selectedPerm?.id ?? '—'}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <div className="text-xs font-medium text-muted-foreground">Permission</div>
              <div className="mt-1 text-base font-semibold">{selectedPerm?.label ?? '—'}</div>
              <div className="mt-1 font-mono text-[11px] text-muted-foreground">{selectedPerm?.id ?? '—'}</div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Current access</div>
                <span
                  className={cn(
                    'rounded-md border px-2 py-0.5 text-[10px] font-medium',
                    selectedRole?.permissionIds.includes(selectedPermId ?? '')
                      ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-200'
                      : 'border-border bg-background text-muted-foreground'
                  )}
                >
                  {selectedRole?.permissionIds.includes(selectedPermId ?? '') ? 'Allowed' : 'Denied'}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPermOpen(false)}>
              Close
            </Button>
            <Button disabled className="opacity-60">
              Update access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
