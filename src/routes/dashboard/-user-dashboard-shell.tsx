import type { ReactNode } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { CreditCard, History, Link2, User } from 'lucide-react';
import { Sparkles } from 'lucide-react';
import { FreeCutLogo } from '@/components/brand/freecut-logo';
import { HeaderProfileMenu } from '@/components/shell/header-profile-menu';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/shared/ui/cn';
import { useAuthStore } from '@/stores/auth-store';

const ACCOUNT_NAV = [
  { to: '/dashboard/profile' as const, label: 'Profile', icon: User, enabled: true },
  { to: '/dashboard/plans' as const, label: 'Plans', icon: CreditCard, enabled: true },
  { to: '/dashboard/purchase-history' as const, label: 'Purchase history', icon: History, enabled: true },
  { to: '/dashboard/connected-accounts' as const, label: 'Connected Accounts', icon: Link2, enabled: true },
  // { to: '/dashboard/developers' as const, label: 'Developers', icon: Code2, enabled: true },
] as const;

export function UserDashboardShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const user = useAuthStore((s) => s.user);
  const displayName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email
    : 'Guest';
  const email = user?.email ?? '';

  return (
    <div className="min-h-screen bg-muted/30 text-foreground">
      <header className="panel-header border-b border-border bg-background">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-6 py-4">
          <div className="flex min-w-0 items-center gap-4">
            <Link to="/" className="shrink-0">
              <FreeCutLogo variant="full" size="md" className="opacity-90 transition-opacity hover:opacity-100" />
            </Link>
            <Separator orientation="vertical" className="hidden h-8 sm:block" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 shrink-0 text-primary" />
                <h1 className="truncate text-sm font-semibold tracking-tight sm:text-base">Dashboard</h1>
              </div>
            </div>
          </div>
          <HeaderProfileMenu
            variant="user"
            profileTo="/dashboard/profile"
            displayName={displayName}
            email={email}
          />
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1200px] px-6 py-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
          <aside className="shrink-0 lg:w-72">
            <div className="text-sm font-semibold">My Account</div>
            <nav className="mt-3 overflow-hidden rounded-md border border-border bg-background">
              {ACCOUNT_NAV.map(({ to, label, icon: Icon, enabled }) => {
                const active = enabled && to ? pathname === to || pathname.startsWith(`${to}/`) : false;
                const itemClass = cn(
                  'flex w-full items-center gap-2 px-4 py-3 text-sm transition-colors border-l-2',
                  active
                    ? 'border-primary bg-primary/8 font-semibold text-foreground'
                    : 'border-transparent text-muted-foreground',
                  enabled ? 'hover:bg-muted/70 hover:text-foreground' : 'opacity-60'
                );

                if (enabled && to) {
                  return (
                    <Link key={label} to={to} className={itemClass}>
                      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span>{label}</span>
                    </Link>
                  );
                }

                return (
                  <div key={label} className={itemClass} aria-disabled="true">
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span>{label}</span>
                  </div>
                );
              })}
            </nav>
          </aside>

          <main className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <div className="mt-6">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
