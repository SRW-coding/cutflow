import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { FreeCutLogo } from '@/components/brand/freecut-logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/infrastructure/api/auth';
import { useAuthStore } from '@/stores/auth-store';

export const Route = createFileRoute('/otp')({
  validateSearch: (search: Record<string, unknown>) => ({
    email: typeof search.email === 'string' ? search.email : '',
    mode: search.mode === 'signup' ? ('signup' as const) : ('reset' as const),
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  component: OtpPage,
});

function normalizeOtp(value: string): string {
  return value.replace(/\D/g, '').slice(0, 6);
}

function OtpPage() {
  const navigate = useNavigate();
  const { email, mode, redirect } = Route.useSearch();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [otp, setOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resent, setResent] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const otpError = useMemo(() => {
    if (!otp) return null;
    return otp.length === 6 ? null : 'Enter the 6-digit code.';
  }, [otp]);

  const canSubmit = !submitting && otp.length === 6 && !otpError;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      if (mode === 'signup') {
        const res = await authApi.verifyEmailOtp(email, otp);
        setAuth(res.user, res.tokens);
        await navigate({ to: (redirect as never) || '/projects' });
      } else {
        const { resetToken } = await authApi.verifyOtp(email, otp);
        await navigate({ to: '/reset-password', search: { email, token: resetToken } });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid code';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const onResend = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      if (mode === 'signup') {
        await authApi.resendVerificationOtp(email);
      } else {
        await authApi.forgotPassword(email);
      }
      setResent(true);
      setOtp('');
      inputRef.current?.focus();
      setTimeout(() => setResent(false), 2500);
    } catch {
      // fail silently
    } finally {
      setSubmitting(false);
    }
  };

  const backLink = mode === 'signup'
    ? <Link to="/signup" className="font-medium text-primary hover:underline">Back to sign up</Link>
    : <Link to="/forgot-password" className="font-medium text-primary hover:underline">Use a different email</Link>;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <FreeCutLogo variant="full" size="md" className="text-primary" />
            <Link to="/" className="text-sm text-primary underline hover:text-primary/80">
              Back to home
            </Link>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-semibold tracking-tight">
              {mode === 'signup' ? 'Verify your email' : 'Enter verification code'}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {email
                ? <>We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>.</>
                : 'Enter the 6-digit code we sent to your email.'}
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="otp">One-time code</Label>
              <Input
                ref={(el) => { inputRef.current = el; }}
                id="otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(normalizeOtp(e.target.value))}
              />
              {otpError && <p className="text-xs text-destructive">{otpError}</p>}
              {resent && <p className="text-xs text-muted-foreground">New code sent.</p>}
            </div>

            <Button type="submit" className="w-full" disabled={!canSubmit}>
              {submitting ? 'Verifying…' : mode === 'signup' ? 'Verify & Continue' : 'Verify'}
            </Button>

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground"
                onClick={onResend}
                disabled={submitting}
              >
                Resend code
              </button>
              {backLink}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
