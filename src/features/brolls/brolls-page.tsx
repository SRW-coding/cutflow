import { Link } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { Film, Image as ImageIcon, LayoutDashboard, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { FreeCutLogo } from '@/components/brand/freecut-logo';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  fetchBrollLibrary,
  suggestedFileNameForBroll,
  type BrollLibraryItem,
} from '@/features/brolls/deps/broll-library-api';
import { mediaLibraryService } from '@/features/brolls/deps/media-library';
import { useProjectStore } from '@/features/brolls/deps/projects';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i] as T;
    arr[i] = arr[j] as T;
    arr[j] = tmp;
  }
  return arr;
}

export function BrollsPage({ fixedProjectId }: { fixedProjectId?: string }) {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<BrollLibraryItem[]>([]);
  const [importingKey, setImportingKey] = useState<string | null>(null);

  const projects = useProjectStore((s) => s.projects);
  const currentProject = useProjectStore((s) => s.currentProject);
  const loadProjects = useProjectStore((s) => s.loadProjects);

  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const effectiveProjectId = fixedProjectId || selectedProjectId;

  const [projectPickerOpen, setProjectPickerOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        await loadProjects();
        const categories = await fetchBrollLibrary();
        const flat: BrollLibraryItem[] = [];
        for (const cat of categories) {
          for (const sub of cat.subcategories ?? []) {
            for (const it of sub.items ?? []) flat.push(it);
          }
        }
        shuffleInPlace(flat);
        if (!cancelled) setItems(flat);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to load b-roll library.';
        if (!cancelled) setError(message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [loadProjects]);

  useEffect(() => {
    if (fixedProjectId) return;
    if (selectedProjectId) return;

    const preferred = currentProject?.id || projects[0]?.id || '';
    if (preferred) {
      setSelectedProjectId(preferred);
      return;
    }

    if (!isLoading) setProjectPickerOpen(true);
  }, [currentProject?.id, fixedProjectId, isLoading, projects, selectedProjectId]);

  const projectName = useMemo(() => {
    const pid = effectiveProjectId;
    if (!pid) return null;
    return projects.find((p) => p.id === pid)?.name ?? null;
  }, [effectiveProjectId, projects]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => {
      const hay = `${it.name ?? ''} ${it.description ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, query]);

  const startImport = async (item: BrollLibraryItem) => {
    const projectId = effectiveProjectId;
    if (!projectId) {
      setProjectPickerOpen(true);
      return;
    }

    const key = String(item.id);
    setImportingKey(key);
    try {
      const res = await fetch(item.url, { mode: 'cors', credentials: 'omit' });
      if (!res.ok) throw new Error(`Download failed (${res.status})`);
      const blob = await res.blob();
      const fileName = suggestedFileNameForBroll(item.name, item.url);
      const mime = blob.type || (item.type === 'video' ? 'video/mp4' : 'image/jpeg');
      const file = new File([blob], fileName, { type: mime });

      const meta = await mediaLibraryService.importMediaFromFile(file, projectId, {
        tags: ['b-roll'],
      });

      if (meta.isDuplicate) {
        toast.info('Already in project media', { description: `"${meta.fileName}" is already in "${projectName ?? 'project'}".` });
      } else {
        toast.success('Imported to project media', { description: `"${meta.fileName}" added to "${projectName ?? 'project'}".` });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Import failed.';
      toast.error('Import failed', { description: msg });
    } finally {
      setImportingKey(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="panel-header border-b border-border">
        <div className="max-w-[1920px] mx-auto px-6 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Link to="/" className="shrink-0">
              <FreeCutLogo variant="full" size="md" className="hover:opacity-80 transition-opacity" />
            </Link>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-foreground truncate">B-roll Library</div>
              <div className="text-xs text-muted-foreground truncate">
                {projectName ? `Importing into: ${projectName}` : 'Choose a project to import into'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link to="/dashboard">
              <Button variant="outline" size="lg">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            {!fixedProjectId && (
              <Button variant="outline" size="lg" onClick={() => setProjectPickerOpen(true)}>
                Choose Project
              </Button>
            )}
            {effectiveProjectId ? (
              <Link to="/editor/$projectId" params={{ projectId: effectiveProjectId }}>
                <Button variant="outline" size="lg">
                  Return to Editor
                </Button>
              </Link>
            ) : (
              <Link to="/projects">
                <Button variant="outline" size="lg">
                  Back to Projects
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="border-b border-border bg-card/30">
        <div className="max-w-[1920px] mx-auto px-6 py-6">
          <div className="relative max-w-3xl mx-auto">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search b-roll…"
              className="h-14 pl-12 pr-4 text-base bg-background/60 backdrop-blur-sm border-border/80 shadow-sm focus-visible:ring-2 focus-visible:ring-primary/30"
            />
          </div>
          <div className="mt-3 text-center text-xs text-muted-foreground">
            {isLoading ? 'Loading b-roll…' : `${filtered.length.toLocaleString()} results`}
          </div>
        </div>
      </div>

      <main className="max-w-[1920px] mx-auto px-6 py-8">
        {error && (
          <div className="max-w-3xl mx-auto mb-8">
            <Alert variant="destructive">
              <div className="font-semibold leading-none tracking-tight">Couldn’t load b-roll</div>
              <AlertDescription className="mt-2">{error}</AlertDescription>
            </Alert>
          </div>
        )}

        {isLoading ? (
          <BrollGridSkeleton />
        ) : filtered.length === 0 ? (
          <div className="max-w-3xl mx-auto">
            <div className="rounded-xl border border-border bg-card p-10 text-center">
              <div className="text-lg font-semibold">No matches</div>
              <div className="mt-2 text-sm text-muted-foreground">Try a different search term.</div>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
            {filtered.map((it) => (
              <BrollCard
                key={it.id}
                item={it}
                busy={importingKey === String(it.id)}
                onImport={() => void startImport(it)}
              />
            ))}
          </div>
        )}
      </main>

      <Dialog
        open={projectPickerOpen}
        onOpenChange={(open) => {
          if (fixedProjectId) return;
          setProjectPickerOpen(open);
        }}
      >
        <DialogContent className="max-w-md" hideCloseButton={fixedProjectId || importingKey !== null}>
          <DialogHeader>
            <DialogTitle>Select project</DialogTitle>
            <DialogDescription>Pick which project should receive imported b-roll.</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <div className="text-sm font-medium">Project</div>
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId} disabled={importingKey !== null}>
              <SelectTrigger>
                <SelectValue placeholder={projects.length ? 'Select a project…' : 'No projects available'} />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!projects.length && (
              <div className="text-xs text-muted-foreground">Create a project first from the Projects page.</div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setProjectPickerOpen(false)} disabled={!selectedProjectId}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <footer className="border-t border-border px-6 py-8">
        <div className="mx-auto max-w-5xl text-center text-sm text-muted-foreground">
          MIT License © {new Date().getFullYear()} FreeCut
        </div>
      </footer>
    </div>
  );
}

function BrollCard({ item, busy, onImport }: { item: BrollLibraryItem; busy: boolean; onImport: () => void }) {
  const thumb = item.thumbnail_url || (item.type === 'image' ? item.url : null);
  return (
    <button
      type="button"
      onClick={onImport}
      disabled={busy}
      className="group relative overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 text-left disabled:opacity-70"
      title={`Import "${item.name}" to a project`}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {thumb ? (
          <img src={thumb} alt={item.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-muted-foreground">
            <div className="flex items-center gap-2 text-sm">
              <ImageIcon className="h-4 w-4" />
              No thumbnail
            </div>
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent opacity-90" />

        <div className="absolute left-3 top-3 flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/45 px-2.5 py-1 text-[11px] text-white backdrop-blur-sm">
            {item.type === 'video' ? <Film className="h-3.5 w-3.5" /> : <ImageIcon className="h-3.5 w-3.5" />}
            <span className="capitalize">{item.type}</span>
          </div>
          {item.is_premium && (
            <div className="inline-flex items-center rounded-full border border-amber-400/20 bg-amber-500/15 px-2.5 py-1 text-[11px] text-amber-300 backdrop-blur-sm">
              Premium
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-3">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white truncate">{item.name}</div>
              {item.description ? (
                <div className="mt-0.5 text-xs text-white/75 line-clamp-2">{item.description}</div>
              ) : (
                <div className="mt-0.5 text-xs text-white/60"> </div>
              )}
            </div>
            <div className="shrink-0 rounded-full border border-white/10 bg-black/45 px-3 py-1.5 text-[11px] text-white/90 backdrop-blur-sm transition-colors group-hover:bg-black/55">
              {busy ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Importing…
                </span>
              ) : (
                'Import'
              )}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

function BrollGridSkeleton() {
  const tiles = Array.from({ length: 12 });
  return (
    <div className="grid gap-4 sm:gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
      {tiles.map((_, idx) => (
        <div key={idx} className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="aspect-[4/3] w-full bg-muted relative overflow-hidden">
            <div className="absolute inset-0 animate-shimmer opacity-20">
              <div className="h-full w-1/3 bg-white/20" />
            </div>
          </div>
          <div className="p-3 space-y-2">
            <div className="h-3 w-2/3 rounded bg-muted" />
            <div className="h-3 w-1/2 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

