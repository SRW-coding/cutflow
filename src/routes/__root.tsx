import { createRootRoute, Link, Outlet } from '@tanstack/react-router';
import { FreeCutLogo } from '@/components/brand/freecut-logo';
import { Button } from '@/components/ui/button';

export const Route = createRootRoute({
  component: () => (
    <>
      <Outlet />
    </>
  ),
  notFoundComponent: () => (
    <div className="min-h-screen bg-background">
      <header className="panel-header border-b border-border">
        <div className="max-w-[1920px] mx-auto px-6 py-5 flex items-center justify-between gap-4">
          <Link to="/" className="shrink-0">
            <FreeCutLogo variant="full" size="md" className="hover:opacity-80 transition-opacity" />
          </Link>
          <div className="flex items-center gap-2 shrink-0">
            <Link to="/projects">
              <Button variant="outline" size="lg">Projects</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-[1920px] mx-auto px-6 py-20">
        <div className="max-w-2xl mx-auto rounded-xl border border-border bg-card p-10 text-center">
          <div className="text-4xl font-bold tracking-tight">404</div>
          <div className="mt-2 text-lg font-semibold">Page not found</div>
          <div className="mt-3 text-sm text-muted-foreground">
            The page you’re looking for doesn’t exist (or was moved).
          </div>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/projects">
              <Button size="lg">Go to Projects</Button>
            </Link>
            <Link to="/brolls">
              <Button variant="outline" size="lg">Browse B-roll</Button>
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-border px-6 py-8">
        <div className="mx-auto max-w-5xl text-center text-sm text-muted-foreground">
          MIT License © {new Date().getFullYear()} FreeCut
        </div>
      </footer>
    </div>
  ),
});
