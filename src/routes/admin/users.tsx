import { createFileRoute } from '@tanstack/react-router';
import { KeyRound, Mail, Pencil, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AdminShell } from './-admin-shell';
import { AdminIconButton, PlanBadge, StatusBadge } from './-admin-components';
import { MOCK_ANALYTICS, MOCK_PERMISSION_DEFS, MOCK_ROLES, MOCK_USERS, formatInt, type MockUser } from './-mock';
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

export const Route = createFileRoute('/admin/users')({
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [rolesOpen, setRolesOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const selectedUser = useMemo(
    () => (selectedUserId ? MOCK_USERS.find((u) => u.id === selectedUserId) : undefined),
    [selectedUserId]
  );

  function openEdit(user: MockUser) {
    setSelectedUserId(user.id);
    setEditUserOpen(true);
  }

  function openRoles(user: MockUser) {
    setSelectedUserId(user.id);
    setRolesOpen(true);
  }

  function openDelete(user: MockUser) {
    setSelectedUserId(user.id);
    setDeleteOpen(true);
  }

  return (
    <AdminShell
      title="Users"
      description="Directory of accounts."
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
                <th className="px-4 py-3 font-medium text-muted-foreground text-right tabular-nums whitespace-nowrap">
                  Usage tokens
                </th>
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
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground whitespace-nowrap">
                    {formatInt(u.usageTokens)}
                    <span className="ml-2 align-middle font-mono text-[10px] text-muted-foreground/80">
                      tokens
                    </span>
                  </td>
                  <td className="px-4 py-3 tabular-nums text-muted-foreground">{u.joined}</td>
                  <td className="px-2 py-2">
                    <div className="flex items-center justify-end gap-0.5">
                      <AdminIconButton label="Edit user" icon={Pencil} onClick={() => openEdit(u)} />
                      <AdminIconButton label="Roles & permissions" icon={KeyRound} onClick={() => openRoles(u)} />
                      <AdminIconButton
                        label="Delete user"
                        icon={Trash2}
                        variant="destructive"
                        onClick={() => openDelete(u)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
          <span>
            Showing {MOCK_USERS.length} of {formatInt(MOCK_ANALYTICS.totalUsers)}
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

      <Dialog open={editUserOpen} onOpenChange={setEditUserOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit user</DialogTitle>
            <DialogDescription>
              Update account details for {selectedUser?.name ?? 'this user'}.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <div className="text-xs font-medium text-muted-foreground">Name</div>
              <div className="rounded-md border border-border bg-muted/20 px-3 py-2 text-sm">
                {selectedUser?.name ?? '—'}
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="text-xs font-medium text-muted-foreground">Email</div>
              <div className="rounded-md border border-border bg-muted/20 px-3 py-2 text-sm">
                {selectedUser?.email ?? '—'}
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="text-xs font-medium text-muted-foreground">Plan</div>
              <div className="rounded-md border border-border bg-muted/20 px-3 py-2 text-sm">
                {selectedUser ? <PlanBadge plan={selectedUser.plan} /> : '—'}
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="text-xs font-medium text-muted-foreground">Status</div>
              <div className="rounded-md border border-border bg-muted/20 px-3 py-2 text-sm">
                {selectedUser ? <StatusBadge status={selectedUser.status} /> : '—'}
              </div>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <div className="text-xs font-medium text-muted-foreground">Usage tokens</div>
              <div className="flex items-center justify-between rounded-md border border-border bg-muted/20 px-3 py-2 text-sm">
                <span className="font-medium tabular-nums">{formatInt(selectedUser?.usageTokens ?? 0)}</span>
                <span className="font-mono text-[10px] text-muted-foreground">tokens</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUserOpen(false)}>
              Close
            </Button>
            <Button disabled className="opacity-60">
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rolesOpen} onOpenChange={setRolesOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Roles & permissions</DialogTitle>
            <DialogDescription>
              Roles assigned to <span className="font-medium">{selectedUser?.name ?? 'this user'}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-card">
              <div className="border-b border-border px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Roles
              </div>
              <div className="p-4 space-y-2">
                {MOCK_ROLES.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    className={cn(
                      'flex w-full items-start justify-between gap-3 rounded-lg border border-border/80 bg-muted/20 px-3 py-2 text-left transition-colors',
                      'hover:bg-muted/35'
                    )}
                    onClick={() => {}}
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{r.name}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">{r.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card">
              <div className="border-b border-border px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Permissions
              </div>
              <div className="p-4 space-y-2">
                {MOCK_PERMISSION_DEFS.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-lg border border-border/80 bg-muted/20 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{p.label}</div>
                      <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">{p.id}</div>
                    </div>
                    <span className="shrink-0 rounded-md border border-border bg-background px-2 py-0.5 text-[10px] text-muted-foreground">
                      —
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRolesOpen(false)}>
              Close
            </Button>
            <Button disabled className="opacity-60">
              Apply changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedUser ? (
                <>
                  <span className="mt-2 block">
                    You’re about to delete <span className="font-medium">{selectedUser.name}</span> (
                    <span className="font-mono">{selectedUser.email}</span>).
                  </span>
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => setDeleteOpen(false)}>
              Delete user
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminShell>
  );
}
