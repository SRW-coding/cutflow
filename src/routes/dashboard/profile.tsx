import { createFileRoute } from '@tanstack/react-router';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserDashboardShell } from './-user-dashboard-shell';
import { useAuthStore } from '@/stores/auth-store';
import { useState } from 'react';

export const Route = createFileRoute('/dashboard/profile')({
  component: UserProfilePage,
});

function DetailsRow({
  label,
  value,
  actionLabel = 'Edit',
}: {
  label: string;
  value: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-6 py-3">
      <div className="min-w-0">
        <div className="text-[11px] font-medium text-muted-foreground">{label}</div>
        <div className="mt-1 truncate text-sm text-foreground">{value}</div>
      </div>
      <button
        type="button"
        className="shrink-0 text-xs font-medium text-primary hover:underline"
        onClick={() => {
          // design-only
        }}
      >
        {actionLabel}
      </button>
    </div>
  );
}

function UserProfilePage() {
  const user = useAuthStore((s) => s.user);
  const [emailPref, setEmailPref] = useState(false);
  const [language, setLanguage] = useState('en');

  const fullName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(' ') || '—'
    : '—';
  const userName = user?.email?.split('@')[0] ?? '—';

  return (
    <UserDashboardShell title="Profile">
      <section className="rounded-md border border-border bg-background">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <div className="text-sm font-semibold">User details</div>
          </div>
        </div>
        <Separator />
        <div className="px-6">
          <DetailsRow label="Name" value={fullName} />
          <Separator />
          <DetailsRow label="User ID" value={user?.id ?? '—'} actionLabel="Copy" />
          <Separator />
          <DetailsRow label="User Name" value={userName} actionLabel="Edit" />
          <Separator />
          <DetailsRow label="Password" value="••••••••••••" actionLabel="Change" />
          <Separator />
          <DetailsRow label="E-mail" value={user?.email ?? '—'} actionLabel="Edit" />
        </div>
      </section>

      <div className="h-8" />

      <section className="rounded-md border border-border bg-background">
        <div className="px-6 py-4">
          <div className="text-sm font-semibold">Preferences</div>
        </div>
        <Separator />

        <div className="px-6 py-4">
          <div className="text-sm font-semibold">Email Preferences</div>
          <p className="mt-1 text-xs text-muted-foreground">
            Opt-in to receive personalized content recommendations, new product updates, and exciting announcements.
          </p>
          <div className="mt-4 flex items-center justify-end">
            <Switch checked={emailPref} onCheckedChange={setEmailPref} aria-label="Email preferences" />
          </div>
        </div>

        <Separator />

        <div className="px-6 py-4">
          <div className="text-sm font-semibold">Language Preference</div>
          <p className="mt-1 text-xs text-muted-foreground">
            Select your language. This language will be used for e-mails you receive from us and browsing our site.
          </p>
          <div className="mt-4 max-w-xs">
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>
    </UserDashboardShell>
  );
}
