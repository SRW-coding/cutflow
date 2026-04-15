import { createFileRoute } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { UserDashboardShell } from './-user-dashboard-shell';
import { MOCK_DASHBOARD_USER } from './-user-dashboard-mock';

export const Route = createFileRoute('/dashboard/profile')({
  component: UserProfilePage,
});

function UserProfilePage() {
  return (
    <UserDashboardShell
      title="Profile"
      description="Account settings. UI only — nothing is persisted."
    >
      <div className="max-w-lg rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/15 text-lg font-semibold text-primary">
            {MOCK_DASHBOARD_USER.initials}
          </div>
          <div className="mt-4 min-w-0 sm:ml-4 sm:mt-0">
            <p className="font-semibold">{MOCK_DASHBOARD_USER.displayName}</p>
            <p className="text-sm text-muted-foreground">Editor</p>
          </div>
        </div>
        <Separator className="my-6" />
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Display name</label>
            <Input defaultValue={MOCK_DASHBOARD_USER.displayName} readOnly className="bg-muted/30" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Email</label>
            <Input defaultValue={MOCK_DASHBOARD_USER.email} readOnly className="bg-muted/30" />
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button type="button" variant="default" size="sm" disabled className="opacity-60">
            Save changes
          </Button>
          <Button type="button" variant="outline" size="sm" disabled className="opacity-60">
            Change password
          </Button>
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">Connect your API to enable saving.</p>
      </div>
    </UserDashboardShell>
  );
}
