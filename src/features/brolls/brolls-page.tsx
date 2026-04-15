import { Link } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, LayoutDashboard, Loader2, Search } from 'lucide-react';
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

type BrollItemWithMeta = BrollLibraryItem & {
  __categoryId: number;
  __categoryName: string;
  __subcategoryId: number;
  __subcategoryName: string;
};

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
  const [items, setItems] = useState<BrollItemWithMeta[]>([]);
  const [importingKey, setImportingKey] = useState<string | null>(null);
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);
  const [categories, setCategories] = useState<Array<{ id: number; name: string; thumbnailUrl: string | null }>>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | 'all'>('all');
  const heroVideos = useMemo(
    () => [
      '/assets/hero/0109-53-3banec400z_1080__D.mp4',
      '/assets/hero/66b22d2406b4320c51ed519e-lpt-sbpbxg_1080__D.mp4',
      '/assets/hero/sunny-view-of-miami-beach-florida-usa-on-hot-day-2025-08-29-02-31-26-utc-r6hjf3xm43_1080__D.mp4',
    ],
    []
  );
  const [heroIndex, setHeroIndex] = useState(0);

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
        const lib = await fetchBrollLibrary();
        setCategories(
          (lib ?? []).map((c) => {
            const firstThumb =
              c.subcategories?.flatMap((s) => s.items ?? []).find((it) => Boolean(it.thumbnail_url))?.thumbnail_url ?? null;
            return { id: c.id, name: c.name, thumbnailUrl: firstThumb };
          })
        );
        const flat: BrollItemWithMeta[] = [];
        for (const cat of lib) {
          for (const sub of cat.subcategories ?? []) {
            for (const it of sub.items ?? []) {
              flat.push({
                ...it,
                __categoryId: cat.id,
                __categoryName: cat.name,
                __subcategoryId: sub.id,
                __subcategoryName: sub.name,
              });
            }
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
    return items.filter((it) => {
      if (selectedCategoryId !== 'all' && it.__categoryId !== selectedCategoryId) return false;
      if (!q) return true;
      const hay = `${it.name ?? ''} ${it.description ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, query, selectedCategoryId]);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<15 | 30 | 60>(30);
  const pageCount = useMemo(() => Math.max(1, Math.ceil(filtered.length / pageSize)), [filtered.length, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [query, selectedCategoryId]);

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setHeroIndex((i) => (i + 1) % heroVideos.length);
    }, 12000);
    return () => window.clearInterval(id);
  }, [heroVideos.length]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

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

  const startDownload = async (item: BrollLibraryItem) => {
    const key = String(item.id);
    setDownloadingKey(key);
    try {
      const res = await fetch(item.url, { mode: 'cors', credentials: 'omit' });
      if (!res.ok) throw new Error(`Download failed (${res.status})`);
      const blob = await res.blob();
      const fileName = suggestedFileNameForBroll(item.name, item.url);
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.rel = 'noreferrer';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Download failed.';
      toast.error('Download failed', { description: msg });
    } finally {
      setDownloadingKey(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="panel-header border-b border-border">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-2 py-5 sm:px-4 lg:px-6">
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

      <div className="relative h-[420px] overflow-hidden border-b border-border bg-card/30">
        <div className="absolute inset-0 overflow-hidden">
          <video
            key={heroVideos[heroIndex]}
            className="h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
          >
            <source src={heroVideos[heroIndex]} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-background/20 backdrop-blur-[1px]" />
        </div>
        <div className="relative mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
          <div className="relative max-w-3xl mx-auto">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search b-roll…"
              className="h-14 pl-12 pr-28 text-base text-white placeholder:text-white/80 bg-black/35 backdrop-blur-sm border-0 shadow-sm focus-visible:ring-2 focus-visible:ring-white/25"
            />
            <Button
              type="button"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/15 text-white border border-white/10"
              onClick={() => setQuery((q) => q)}
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </Button>
          </div>
          <div className="mt-3 text-center text-xs text-white/80">
            {isLoading ? 'Loading b-roll…' : `${filtered.length.toLocaleString()} results`}
          </div>

          {!isLoading && categories.length ? (
            <section className="mt-6 rounded-lg bg-background/20 p-4 backdrop-blur-sm">
              <div className="text-sm font-semibold text-foreground">Explore Stock Footage Categories</div>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                <button
                  type="button"
                  onClick={() => setSelectedCategoryId('all')}
                  className={[
                    'group flex w-full items-center gap-4 rounded-md bg-black/20 p-4 text-left transition-colors hover:bg-white/10',
                    selectedCategoryId === 'all' ? 'bg-white/10 ring-1 ring-primary/40' : 'ring-1 ring-transparent',
                  ].join(' ')}
                >
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted/60">
                    {categories.find((c) => Boolean(c.thumbnailUrl))?.thumbnailUrl ? (
                      <img
                        src={categories.find((c) => Boolean(c.thumbnailUrl))?.thumbnailUrl ?? ''}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">All</div>
                  </div>
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(c.id)}
                    className={[
                      'group flex w-full items-center gap-4 rounded-md bg-black/20 p-4 text-left transition-colors hover:bg-white/10',
                      selectedCategoryId === c.id ? 'bg-white/10 ring-1 ring-primary/34' : 'ring-1 ring-transparent',
                    ].join(' ')}
                  >
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted/60">
                      {c.thumbnailUrl ? (
                        <img src={c.thumbnailUrl} alt={c.name} className="h-full w-full object-cover" loading="lazy" />
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{c.name}</div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>

      <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
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
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
              {pageItems.map((it) => (
              <BrollCard
                key={it.id}
                item={it}
                importing={importingKey === String(it.id)}
                downloading={downloadingKey === String(it.id)}
                onImport={() => void startImport(it)}
                onDownload={() => void startDownload(it)}
              />
            ))}
            </div>

            {pageCount > 1 ? (
              <div className="grid grid-cols-3 items-center">
                <div />
                <div className="justify-self-center">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-primary/15 text-white hover:bg-primary/20"
                    disabled={page >= pageCount}
                    onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  >
                    Next page
                  </Button>
                </div>
                <div className="justify-self-end">
                  <div className="flex items-center gap-2">
                    <div className="hidden items-center gap-2 sm:flex">
                      <div className="text-xs text-muted-foreground">Per page</div>
                      <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v) as 15 | 30 | 60)}>
                        <SelectTrigger className="h-9 w-[90px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15</SelectItem>
                          <SelectItem value="30">30</SelectItem>
                          <SelectItem value="60">60</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="hidden px-1 text-xs text-muted-foreground sm:block">
                      Page {page} of {pageCount}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={page >= pageCount}
                      onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                      aria-label="Next page"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}
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
        <DialogContent className="max-w-md" hideCloseButton={Boolean(fixedProjectId) || importingKey !== null}>
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
        {/* <div className="mx-auto max-w-5xl text-center text-sm text-muted-foreground">
          MIT License © {new Date().getFullYear()} FreeCut
        </div> */}
      </footer>
    </div>
  );
}

function BrollCard({
  item,
  importing,
  downloading,
  onImport,
  onDownload,
}: {
  item: BrollItemWithMeta;
  importing: boolean;
  downloading: boolean;
  onImport: () => void;
  onDownload: () => void;
}) {
  const thumb = item.thumbnail_url || (item.type === 'image' ? item.url : null);
  return (
    <div className="group relative overflow-hidden rounded-md border border-border bg-card shadow-sm transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 text-left">
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {thumb ? (
          <img src={thumb} alt={item.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-muted-foreground">
            <div className="flex items-center gap-2 text-sm">
              No thumbnail
            </div>
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100" />

        <div className="absolute bottom-0 left-0 right-0 p-3 pointer-events-none opacity-0 translate-y-1 transition-all duration-200 group-hover:pointer-events-auto group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-focus-within:translate-y-0">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white truncate">{item.name}</div>
              {item.description ? (
                <div className="mt-0.5 text-xs text-white/75 line-clamp-2">{item.description}</div>
              ) : (
                <div className="mt-0.5 text-xs text-white/60"> </div>
              )}
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <button
                type="button"
                className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-black/45 px-3 py-1.5 text-[11px] text-white/90 backdrop-blur-sm transition-colors hover:bg-black/55 disabled:cursor-not-allowed disabled:opacity-70"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDownload();
                }}
                disabled={downloading || importing}
                title={`Download "${item.name}"`}
              >
                {downloading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Downloading…
                  </>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </>
                )}
              </button>
              <button
                type="button"
                className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-black/45 px-3 py-1.5 text-[11px] text-white/90 backdrop-blur-sm transition-colors hover:bg-black/55 disabled:cursor-not-allowed disabled:opacity-70"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onImport();
                }}
                disabled={importing || downloading}
                title={`Import "${item.name}" to a project`}
              >
                {importing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Importing…
                  </>
                ) : (
                  'Import'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BrollGridSkeleton() {
  const tiles = Array.from({ length: 12 });
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
      {tiles.map((_, idx) => (
        <div key={idx} className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="aspect-video w-full bg-muted relative overflow-hidden">
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

