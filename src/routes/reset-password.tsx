import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { FreeCutLogo } from '@/components/brand/freecut-logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/infrastructure/api/auth';

export const Route = createFileRoute('/reset-password')({
  validateSearch: (search: Record<string, unknown>) => ({
    email: typeof search.email === 'string' ? search.email : '',
    token: typeof search.token === 'string' ? search.token : '',
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const { email, token } = Route.useSearch();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const passwordError = useMemo(() => {
    if (!password) return null;
    return password.length >= 8 ? null : 'Password must be at least 8 characters.';
  }, [password]);

  const confirmError = useMemo(() => {
    if (!confirmPassword) return null;
    return confirmPassword === password ? null : 'Passwords do not match.';
  }, [confirmPassword, password]);

  const canSubmit =
    !submitting &&
    !!password &&
    !!confirmPassword &&
    !passwordError &&
    !confirmError;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    if (!token) {
      toast.error('Missing reset token. Please start the forgot-password flow again.');
      return;
    }
    setSubmitting(true);
    try {
      await authApi.resetPassword(token, password);
      toast.success('Password reset successfully. Please sign in.');
      await navigate({ to: '/login' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Reset failed';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <FreeCutLogo variant="icon" size="md" className="text-primary" />
              <div>
                <div className="text-base font-semibold leading-tight">CutFlow</div>
                <div className="text-xs text-muted-foreground">Set new password</div>
              </div>
            </div>
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
              Back to home
            </Link>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-semibold tracking-tight">Create a new password</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {email
                ? <>Resetting password for <span className="font-medium text-foreground">{email}</span>.</>
                : 'Enter and confirm your new password.'}
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="new-password">New password</Label>
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <Input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {passwordError && <p className="text-xs text-destructive">{passwordError}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm-new-password">Confirm new password</Label>
              <Input
                id="confirm-new-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Repeat your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {confirmError && <p className="text-xs text-destructive">{confirmError}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={!canSubmit}>
              {submitting ? 'Saving…' : 'Reset password'}
            </Button>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Didn&apos;t mean to reset?</span>
              <Link to="/login" className="font-medium text-primary hover:underline">
                Back to sign in
              </Link>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}

