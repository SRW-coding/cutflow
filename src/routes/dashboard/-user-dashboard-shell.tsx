import type { ReactNode } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { Clapperboard, FolderOpen, LayoutDashboard, Sparkles } from 'lucide-react';
import { FreeCutLogo } from '@/components/brand/freecut-logo';
import { HeaderProfileMenu } from '@/components/shell/header-profile-menu';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/shared/ui/cn';
import { MOCK_DASHBOARD_USER } from './-user-dashboard-mock';

const NAV = [
  { to: '/dashboard' as const, label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/projects' as const, label: 'Projects', icon: FolderOpen },
  { to: '/brolls' as const, label: 'B-roll', icon: Clapperboard },
];

export function UserDashboardShell({
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
      <header className="panel-header border-b border-border">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-6 py-4">
          <div className="flex min-w-0 items-center gap-4">
            <Link to="/" className="shrink-0">
              <FreeCutLogo variant="full" size="md" className="opacity-90 transition-opacity hover:opacity-100" />
            </Link>
            <Separator orientation="vertical" className="hidden h-8 sm:block" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 shrink-0 text-primary" />
                <h1 className="truncate text-sm font-semibold tracking-tight sm:text-base">Your workspace</h1>
              </div>
              <p className="truncate text-xs text-muted-foreground">Local projects — activity below is sample UI</p>
            </div>
          </div>
          <HeaderProfileMenu
            variant="user"
            profileTo="/dashboard/profile"
            displayName={MOCK_DASHBOARD_USER.displayName}
            email={MOCK_DASHBOARD_USER.email}
          />
        </div>
      </header>

      <div className="mx-auto flex max-w-[1600px] flex-col gap-6 px-6 py-6 lg:flex-row lg:gap-8">
        <aside className="shrink-0 lg:w-52">
          <nav className="flex flex-row gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
            {NAV.map(({ to, label, icon: Icon, end }) => {
              const active = end
                ? pathname === '/dashboard' || pathname === '/dashboard/'
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
