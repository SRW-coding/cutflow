import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useMemo } from 'react';
import {
  ArrowRight,
  Download,
  Film,
  HardDrive,
  Plus,
  Upload,
  Video,
  Clock,
  FolderKanban,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useProjectStore } from '@/features/projects/stores/project-store';
import { useProjectsLoading } from '@/features/projects/hooks/use-project-selectors';
import { cleanupBlobUrls } from '@/features/media-library/utils/media-resolver';
import type { Project } from '@/types/project';
import { UserDashboardShell } from './-user-dashboard-shell';
import { DashboardStatCard } from './-user-dashboard-components';
import {
  MOCK_ACTIVITY,
  MOCK_DASHBOARD_USER,
  MOCK_STORAGE,
  MOCK_WEEKLY_EXPORTS,
} from './-user-dashboard-mock';

export const Route = createFileRoute('/dashboard/')({
  component: UserDashboardPage,
  beforeLoad: async () => {
    cleanupBlobUrls();
    const { loadProjects } = useProjectStore.getState();
    await loadProjects();
  },
});

function formatRelative(ms: number): string {
  const sec = Math.floor((Date.now() - ms) / 1000);
  if (sec < 60) return 'Just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 48) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function activityIcon(kind: (typeof MOCK_ACTIVITY)[number]['kind']) {
  switch (kind) {
    case 'export':
      return Download;
    case 'import':
      return Upload;
    default:
      return Video;
  }
}

function UserDashboardPage() {
  const projects = useProjectStore((s) => s.projects);
  const loadProjects = useProjectStore((s) => s.loadProjects);
  const isLoading = useProjectsLoading();

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  const recent = useMemo(() => {
    return [...projects].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5);
  }, [projects]);

  return (
    <UserDashboardShell
      title="Dashboard"
      description="Pick up where you left off, open a project, or start something new."
    >
      <div className="space-y-8">
        {/* Welcome */}
        <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-primary/25 bg-primary/15 text-lg font-semibold text-primary"
                aria-hidden
              >
                {MOCK_DASHBOARD_USER.initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">
                  {greeting()}, {MOCK_DASHBOARD_USER.displayName.split(' ')[0]}
                </p>
                <h3 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
                  {MOCK_DASHBOARD_USER.displayName}
                </h3>
                <p className="mt-1 truncate text-sm text-muted-foreground">{MOCK_DASHBOARD_USER.email}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:justify-end">
              <Button asChild className="gap-2">
                <Link to="/projects/new">
                  <Plus className="h-4 w-4" />
                  New project
                </Link>
              </Button>
              <Button variant="outline" asChild className="gap-2">
                <Link to="/projects">
                  <FolderKanban className="h-4 w-4" />
                  All projects
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard
            icon={Film}
            label="Projects"
            value={isLoading ? '…' : String(projects.length)}
            hint="Stored locally in this browser"
            accent="primary"
          />
          <DashboardStatCard
            icon={HardDrive}
            label="Storage (sample)"
            value={MOCK_STORAGE.usedLabel}
            hint={`of ${MOCK_STORAGE.quotaLabel} — mock quota`}
            accent="amber"
          />
          <DashboardStatCard
            icon={Download}
            label="Exports this week"
            value={MOCK_WEEKLY_EXPORTS}
            hint="Sample activity — not tracked yet"
          />
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground">Library use (sample)</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{MOCK_STORAGE.percent}%</p>
                <p className="mt-1 text-[11px] text-muted-foreground">Mock meter for future limits</p>
              </div>
              <div className="rounded-lg border border-border/80 bg-muted/50 p-2">
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <Progress value={MOCK_STORAGE.percent} className="mt-3 h-2" />
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-5 lg:gap-10">
          {/* Recent projects */}
          <section className="lg:col-span-3">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold tracking-tight">Recent projects</h3>
              <Link
                to="/projects"
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                View all
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="rounded-xl border border-border bg-card shadow-sm">
              {isLoading ? (
                <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
                  Loading projects…
                </div>
              ) : recent.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
                  <div className="rounded-full border border-dashed border-border p-4">
                    <Film className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">No projects yet</p>
                    <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                      Create a timeline or import a bundle from the projects page.
                    </p>
                  </div>
                  <Button asChild className="gap-2">
                    <Link to="/projects/new">
                      <Plus className="h-4 w-4" />
                      Create project
                    </Link>
                  </Button>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {recent.map((p) => (
                    <RecentProjectRow key={p.id} project={p} />
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* Activity */}
          <section className="lg:col-span-2">
            <div className="mb-4">
              <h3 className="text-sm font-semibold tracking-tight">Recent activity</h3>
              <p className="mt-1 text-xs text-muted-foreground">Illustrative feed for layout — not live data.</p>
            </div>
            <ul className="space-y-2">
              {MOCK_ACTIVITY.map((item) => {
                const Icon = activityIcon(item.kind);
                return (
                  <li
                    key={item.id}
                    className="flex gap-3 rounded-xl border border-border bg-card p-3 shadow-sm"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/80 bg-muted/50">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-snug">{item.title}</p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 shrink-0" />
                        {item.time}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </div>
    </UserDashboardShell>
  );
}

function RecentProjectRow({ project }: { project: Project }) {
  const { width, height, fps } = project.metadata;
  return (
    <li>
      <Link
        to="/editor/$projectId"
        params={{ projectId: project.id }}
        className="group flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-muted/40"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-4">
          <span className="truncate font-medium">{project.name}</span>
          <span className="shrink-0 text-xs text-muted-foreground sm:ml-auto">
            {width}×{height} · {fps} fps
          </span>
        </div>
        <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
          {formatRelative(project.updatedAt)}
        </span>
        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </Link>
    </li>
  );
}
