import type { ReactNode } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { LayoutDashboard, BarChart3, Users, UserCircle, Shield, KeyRound } from 'lucide-react';
import { FreeCutLogo } from '@/components/brand/freecut-logo';
import { HeaderProfileMenu } from '@/components/shell/header-profile-menu';
import { cn } from '@/shared/ui/cn';

const NAV = [
  { to: '/admin' as const, label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/analytics' as const, label: 'Analytics', icon: BarChart3 },
  { to: '/admin/users' as const, label: 'Users', icon: Users },
  { to: '/admin/roles' as const, label: 'Roles', icon: KeyRound },
  { to: '/admin/profile' as const, label: 'Profile', icon: UserCircle },
];

export function AdminShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="cutflow-top-nav sticky top-0 z-40 border-b border-white/10">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-6 py-4">
          <div className="flex min-w-0 items-center gap-4">
            <Link to="/" className="shrink-0">
              <FreeCutLogo variant="full" size="md" className="opacity-90 transition-opacity hover:opacity-100" />
            </Link>
            <div className="min-w-0 pl-1">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 shrink-0 text-primary" />
                <h1 className="truncate text-sm font-semibold tracking-tight sm:text-base">Admin</h1>
              </div>
              <p className="truncate text-xs text-muted-foreground">Administrator</p>
            </div>
          </div>
          <HeaderProfileMenu
            variant="admin"
            profileTo="/admin/profile"
            displayName="Admin User"
            email="admin@cutflow.local"
          />
        </div>
      </header>

      <div className="mx-auto flex max-w-[1600px] flex-col gap-6 px-6 py-6 lg:flex-row lg:gap-8">
        <aside className="shrink-0 lg:w-52">
          <nav className="flex flex-row gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
            {NAV.map(({ to, label, icon: Icon, end }) => {
              const active = end
                ? pathname === '/admin' || pathname === '/admin/'
                : pathname === to || pathname.startsWith(`${to}/`);
              return (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    'flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-primary/15 text-primary'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="mb-6">
            <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
            {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
