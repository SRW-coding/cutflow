import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserDashboardShell } from './-user-dashboard-shell';
import { useAuthStore } from '@/stores/auth-store';
import { usersApi } from '@/infrastructure/api/users';

export const Route = createFileRoute('/dashboard/profile')({
  component: UserProfilePage,
});

function UserProfilePage() {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');

  const [changingPassword, setChangingPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [emailPref, setEmailPref] = useState(false);
  const [language, setLanguage] = useState('en');

  const fullName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(' ') || '—'
    : '—';
  const userName = user?.email?.split('@')[0] ?? '—';

  const handleEditOpen = () => {
    setFirstName(user?.firstName ?? '');
    setLastName(user?.lastName ?? '');
    setEditing(true);
  };

  const handleEditCancel = () => {
    setEditing(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await usersApi.updateProfile({
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
      });
      updateUser({ firstName: updated.firstName, lastName: updated.lastName });
      toast.success('Profile updated');
      setEditing(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyId = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id);
      toast.success('User ID copied');
    }
  };

  const handlePasswordSave = async () => {
    if (newPassword !== confirmNewPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setSavingPassword(true);
    try {
      await usersApi.changePassword({ currentPassword, newPassword });
      toast.success('Password changed successfully');
      setChangingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <UserDashboardShell title="Profile">
      <section className="rounded-md border border-border bg-background">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="text-sm font-semibold">User details</div>
          {!editing && (
            <Button variant="outline" size="sm" onClick={handleEditOpen}>
              Edit
            </Button>
          )}
        </div>
        <Separator />

        {editing ? (
          <div className="space-y-4 px-6 py-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
              <Button size="sm" variant="outline" onClick={handleEditCancel} disabled={saving}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="px-6">
            <Row label="Name" value={fullName} />
            <Separator />
            <Row label="User ID" value={user?.id ?? '—'} action="Copy" onAction={handleCopyId} />
            <Separator />
            <Row label="Username" value={userName} />
            <Separator />
            <Row label="E-mail" value={user?.email ?? '—'} />
          </div>
        )}
      </section>

      <div className="h-6" />

      {/* Change password */}
      <section className="rounded-md border border-border bg-background">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="text-sm font-semibold">Password</div>
          {!changingPassword && (
            <Button variant="outline" size="sm" onClick={() => setChangingPassword(true)}>
              Change
            </Button>
          )}
        </div>
        <Separator />
        {changingPassword ? (
          <div className="space-y-4 px-6 py-5">
            <div className="space-y-1.5">
              <Label htmlFor="currentPassword">Current password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmNewPassword">Confirm new password</Label>
              <Input
                id="confirmNewPassword"
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Repeat new password"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={handlePasswordSave} disabled={savingPassword}>
                {savingPassword ? 'Saving…' : 'Update password'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setChangingPassword(false); setCurrentPassword(''); setNewPassword(''); setConfirmNewPassword(''); }}
                disabled={savingPassword}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="px-6">
            <Row label="Password" value="••••••••••••" />
          </div>
        )}
      </section>

      <div className="h-6" />

      {/* Preferences */}
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

function Row({
  label,
  value,
  action,
  onAction,
}: {
  label: string;
  value: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-6 py-3">
      <div className="min-w-0">
        <div className="text-[11px] font-medium text-muted-foreground">{label}</div>
        <div className="mt-1 truncate text-sm text-foreground">{value}</div>
      </div>
      {action && onAction && (
        <button
          type="button"
          className="shrink-0 text-xs font-medium text-primary hover:underline"
          onClick={onAction}
        >
          {action}
        </button>
      )}
    </div>
  );
}
