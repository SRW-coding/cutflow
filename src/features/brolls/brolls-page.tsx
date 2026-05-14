import { Link } from '@tanstack/react-router';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  LayoutDashboard,
  LayoutGrid,
  Loader2,
  LogOut,
  Play,
  Search,
  User,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { FreeCutLogo } from '@/components/brand/freecut-logo';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  fetchBrollLibrary,
  getCachedBrollLibrary,
  suggestedFileNameForBroll,
  type BrollLibraryItem,
} from '@/features/brolls/deps/broll-library-api';
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
import { useAuthStore } from '@/stores/auth-store';
import { authApi } from '@/infrastructure/api/auth';

const HERO_VIDEO_SRC = '../../../public/assets/hero/hero.mp4';

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

type RawCategory = {
  id: number;
  name: string;
  subcategories?: Array<{
    id: number;
    name: string;
    items?: BrollLibraryItem[];
  }>;
};

type ProcessedLibrary = {
  categories: Array<{ id: number; name: string; thumbnailUrl: string | null }>;
  items: BrollItemWithMeta[];
};

function processLibrary(lib: RawCategory[]): ProcessedLibrary {
  const categories = (lib ?? []).map((c) => {
    const firstThumb =
      c.subcategories
        ?.flatMap((s) => s.items ?? [])
        .find((it) => Boolean(it.thumbnail_url))?.thumbnail_url ?? null;
    return { id: c.id, name: c.name, thumbnailUrl: firstThumb };
  });

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
  return { categories, items: flat };
}

function fingerprintLibrary(items: BrollItemWithMeta[]): string {
  // Cheap signal of whether the underlying library changed since last fetch.
  // If it didn't, we skip the state update to avoid reshuffling visible items.
  let hash = items.length + ':';
  for (let i = 0; i < items.length; i++) {
    hash += items[i]!.id + ',';
  }
  return hash;
}

export function BrollsPage({ fixedProjectId }: { fixedProjectId?: string }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const tokens = useAuthStore((s) => s.tokens);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const handleLogout = () => {
    const rt = tokens?.refreshToken;
    if (rt) authApi.logout(rt).catch(() => {});
    clearAuth();
    toast.success('Signed out');
  };

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchKind, setSearchKind] = useState<'videos'>('videos');

  // Seed state from the persisted cache so repeat visits paint instantly
  // instead of waiting on the network. We still revalidate in the effect below.
  const initialFromCache = useMemo<ProcessedLibrary | null>(() => {
    const cached = getCachedBrollLibrary();
    return cached ? processLibrary(cached as RawCategory[]) : null;
  }, []);

  const [isLoading, setIsLoading] = useState(!initialFromCache);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<BrollItemWithMeta[]>(initialFromCache?.items ?? []);
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);
  const [guestPromptOpen, setGuestPromptOpen] = useState(false);

  // FIX 2: Wrap localStorage read in try/catch to handle SSR and Safari private mode
  const [guestDownloads, setGuestDownloads] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('brolls_guest_downloads') ?? '0', 10);
    } catch {
      return 0;
    }
  });

  const GUEST_DOWNLOAD_LIMIT = 1;
  const [categories, setCategories] = useState<
    Array<{ id: number; name: string; thumbnailUrl: string | null }>
  >(initialFromCache?.categories ?? []);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | 'all'>('all');
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<
    number | 'all' | 'ai' | 'general'
  >('all');

  const [zoomItem, setZoomItem] = useState<BrollItemWithMeta | null>(null);

  // FIX 6: Ref to imperatively pause video before closing the zoom modal
  const zoomVideoRef = useRef<HTMLVideoElement>(null);

  // FIX 5: Track mount state to guard setState calls after async operations
  const mountedRef = useRef(true);
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const projects = useProjectStore((s) => s.projects);
  const currentProject = useProjectStore((s) => s.currentProject);
  const loadProjects = useProjectStore((s) => s.loadProjects);

  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const effectiveProjectId = fixedProjectId || selectedProjectId;

  const [projectPickerOpen, setProjectPickerOpen] = useState(false);

  // Track the fingerprint of the currently-rendered library so we can skip
  // re-rendering (and re-shuffling) when revalidation returns identical data.
  const renderedFingerprintRef = useRef<string>(
    initialFromCache ? fingerprintLibrary(initialFromCache.items) : '',
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // Only show the skeleton when we have nothing at all to render.
      // With a warm cache we keep the existing items visible and revalidate silently.
      if (!initialFromCache) setIsLoading(true);
      setError(null);
      try {
        const [lib] = await Promise.all([fetchBrollLibrary(), loadProjects()]);
        if (cancelled) return;

        const processed = processLibrary(lib as RawCategory[]);
        const nextFp = fingerprintLibrary(processed.items);

        // Identical library → don't reshuffle the visible grid.
        if (nextFp === renderedFingerprintRef.current && initialFromCache) {
          return;
        }
        renderedFingerprintRef.current = nextFp;
        setCategories(processed.categories);
        setItems(processed.items);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to load b-roll library.';
        // Suppress the error overlay if we're already showing cached data —
        // a background revalidate failure shouldn't blow away a working page.
        if (!cancelled && !initialFromCache) setError(message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [loadProjects, initialFromCache]);

  useEffect(() => {
    if (fixedProjectId) return;
    if (selectedProjectId) return;
    const preferred = currentProject?.id || projects[0]?.id || '';
    if (preferred) setSelectedProjectId(preferred);
  }, [currentProject?.id, fixedProjectId, projects, selectedProjectId]);

  const projectName = useMemo(() => {
    const pid = effectiveProjectId;
    if (!pid) return null;
    return projects.find((p) => p.id === pid)?.name ?? null;
  }, [effectiveProjectId, projects]);

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    return items.filter((it) => {
      if (selectedCategoryId !== 'all' && it.__categoryId !== selectedCategoryId) return false;
      if (selectedSubcategoryId === 'ai') {
        if (!/ai/i.test(it.__subcategoryName)) return false;
      } else if (selectedSubcategoryId === 'general') {
        if (!/general/i.test(it.__subcategoryName)) return false;
      } else if (selectedSubcategoryId !== 'all' && it.__subcategoryId !== selectedSubcategoryId) {
        return false;
      }
      if (!q) return true;
      const hay = [
        it.name ?? '',
        it.description ?? '',
        it.__categoryName ?? '',
        it.__subcategoryName ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [items, debouncedQuery, selectedCategoryId, selectedSubcategoryId]);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<15 | 30 | 60>(30);
  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(filtered.length / pageSize)),
    [filtered.length, pageSize],
  );

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedQuery(query), 300);
    return () => window.clearTimeout(id);
  }, [query]);

  // FIX 7: Also reset page when selectedSubcategoryId changes (was missing)
  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, selectedCategoryId, selectedSubcategoryId]);

  useEffect(() => {
    setSelectedSubcategoryId('all');
  }, [selectedCategoryId]);

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  // FIX 4 + FIX 5: Add guestDownloads to deps (fixes stale closure / limit bypass).
  // FIX 5: Use AbortController and mountedRef to prevent state updates after unmount.
  // FIX 3: Move revokeObjectURL into a finally block so it always runs.
  const startDownload = useCallback(
    async (item: BrollLibraryItem, signal: AbortSignal) => {
      if (!isAuthenticated && guestDownloads >= GUEST_DOWNLOAD_LIMIT) {
        setGuestPromptOpen(true);
        return;
      }

      const key = String(item.id);
      if (mountedRef.current) setDownloadingKey(key);

      let url: string | null = null;
      try {
        const res = await fetch(item.url, { mode: 'cors', credentials: 'omit', signal });
        if (!res.ok) throw new Error(`Download failed (${res.status})`);
        const blob = await res.blob();
        const fileName = suggestedFileNameForBroll(item.name, item.url);
        url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.rel = 'noreferrer';
        document.body.appendChild(a);
        try {
          a.click();
        } finally {
          // FIX 3: Always clean up the anchor and object URL
          a.remove();
          URL.revokeObjectURL(url);
          url = null;
        }

        if (!isAuthenticated) {
          const next = guestDownloads + 1;
          try {
            localStorage.setItem('brolls_guest_downloads', String(next));
          } catch {
            // Ignore storage errors (private mode, quota exceeded)
          }
          if (mountedRef.current) setGuestDownloads(next);
        }
      } catch (e) {
        // Ignore AbortError — user navigated away
        if (e instanceof DOMException && e.name === 'AbortError') return;
        const msg = e instanceof Error ? e.message : 'Download failed.';
        if (mountedRef.current) toast.error('Download failed', { description: msg });
      } finally {
        // FIX 3: Belt-and-suspenders: revoke if we somehow exited without revoking
        if (url) {
          URL.revokeObjectURL(url);
        }
        // FIX 5: Only update state if still mounted
        if (mountedRef.current) setDownloadingKey(null);
      }
    },
    [isAuthenticated, guestDownloads], // FIX 4: guestDownloads in deps prevents stale closure
  );

  // Stable per-item download handler that creates a fresh AbortController each time
  const handleDownload = useCallback(
    (item: BrollItemWithMeta) => {
      const controller = new AbortController();
      void startDownload(item, controller.signal);
    },
    [startDownload],
  );

  // FIX 6: Close zoom modal by pausing video first, then clearing state
  const closeZoom = useCallback(() => {
    zoomVideoRef.current?.pause();
    setZoomItem(null);
  }, []);

  // FIX 6: Keyboard Escape support for the zoom modal
  useEffect(() => {
    if (!zoomItem) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeZoom();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [zoomItem, closeZoom]);

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ── */}
      <header className="panel-header border-b border-border">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-2 py-5 sm:px-4 lg:px-6">
          <div className="flex items-center gap-4 min-w-0">
            <Link to="/" className="shrink-0">
              <FreeCutLogo
                variant="full"
                size="md"
                className="hover:opacity-80 transition-opacity"
              />
            </Link>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-foreground truncate">
                CutFlow Video Library
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {projectName ? `Importing into: ${projectName}` : 'Choose a project to import into'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard">
                  <Button variant="outline" size="sm">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
                <div className="ml-1 flex items-center gap-2 border-l border-border pl-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {user?.firstName?.[0]?.toUpperCase() ??
                      user?.email?.[0]?.toUpperCase() ?? <User className="h-4 w-4" />}
                  </div>
                  <span className="hidden max-w-[120px] truncate text-sm font-medium sm:block">
                    {user?.firstName ?? user?.email?.split('@')[0]}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={handleLogout}
                    title="Sign out"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" search={{ redirect: '/brolls' }}>
                  <Button variant="outline" size="sm">
                    Log In
                  </Button>
                </Link>
                <Link to="/signup" search={{ redirect: '/brolls' }}>
                  <Button size="sm">Sign Up Free</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <div className="relative h-[420px] overflow-hidden border-b border-border bg-card/30">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background/60 to-background/90" />
          <HeroVideo src={HERO_VIDEO_SRC} />
          <div className="absolute inset-0 bg-background/20 backdrop-blur-[1px]" />
        </div>

        <div className="relative mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="flex w-full items-center overflow-hidden rounded-md bg-black/35 shadow-sm backdrop-blur-sm ring-1 ring-white/10 focus-within:ring-2 focus-within:ring-white/25">
              <Select value={searchKind} onValueChange={(v) => setSearchKind(v as 'videos')}>
                <SelectTrigger className="h-14 w-[140px] rounded-none border-0 border-r border-white/10 bg-white/5 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="videos">Videos</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/70" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search videos, categories…"
                  className="h-14 w-full rounded-none border-0 bg-transparent pl-12 pr-12 text-base text-white placeholder:text-white/70 shadow-none focus-visible:ring-0"
                />
              </div>
              <Button
                type="button"
                size="sm"
                className="h-14 rounded-none border-0 border-l border-white/10 bg-white/10 px-4 text-white hover:bg-white/15"
                onClick={() => setQuery((q) => q)}
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-center gap-3">
            <span className="text-xs text-white/80">
              {isLoading ? 'Loading b-roll…' : `${filtered.length.toLocaleString()} results`}
            </span>
            {(query || selectedCategoryId !== 'all' || selectedSubcategoryId !== 'all') &&
              !isLoading && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setSelectedCategoryId('all');
                    setSelectedSubcategoryId('all');
                    setPage(1);
                  }}
                  className="text-xs font-medium text-white/70 underline hover:text-white"
                >
                  Reset filters
                </button>
              )}
          </div>

          {!isLoading && categories.length ? (
            <section className="mt-6 rounded-lg bg-background/20 p-4 backdrop-blur-sm">
              <div className="text-sm font-semibold text-foreground">
                Explore Stock Footage Categories
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                <button
                  type="button"
                  onClick={() => setSelectedCategoryId('all')}
                  className={[
                    'group flex w-full items-center gap-4 rounded-md bg-black/20 p-4 text-left transition-colors hover:bg-white/10',
                    selectedCategoryId === 'all'
                      ? 'bg-white/10 ring-1 ring-primary/40'
                      : 'ring-1 ring-transparent',
                  ].join(' ')}
                >
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-white/10 grid place-items-center">
                    <LayoutGrid className="h-7 w-7 text-white/80" />
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
                      selectedCategoryId === c.id
                        ? 'bg-white/10 ring-1 ring-primary/34'
                        : 'ring-1 ring-transparent',
                    ].join(' ')}
                  >
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted/60">
                      {c.thumbnailUrl ? (
                        <img
                          src={c.thumbnailUrl}
                          alt={c.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
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

      {/* ── Main grid ── */}
      <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="max-w-3xl mx-auto mb-8">
            <Alert variant="destructive">
              <div className="font-semibold leading-none tracking-tight">Couldn't load b-roll</div>
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
            <SubcategoryFilters
              items={items}
              selectedCategoryId={selectedCategoryId}
              selectedSubcategoryId={selectedSubcategoryId}
              onChange={setSelectedSubcategoryId}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
              {pageItems.map((it) => (
                <BrollCard
                  key={it.id}
                  item={it}
                  downloading={downloadingKey === String(it.id)}
                  onDownload={handleDownload}
                  onPlay={setZoomItem}
                />
              ))}
            </div>

            {/* FIX 9: Unified pagination — removed the redundant centred "Next page"
                text button. Navigation is now exclusively handled by the icon buttons
                and the page counter on the right, which is consistent and unambiguous. */}
            {pageCount > 1 ? (
              <div className="flex items-center justify-end gap-2">
                <div className="hidden items-center gap-2 sm:flex">
                  <div className="text-xs text-muted-foreground">Per page</div>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(v) => setPageSize(Number(v) as 15 | 30 | 60)}
                  >
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
            ) : null}
          </div>
        )}
      </main>

      {/* ── Zoom modal ── */}
      {zoomItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={closeZoom} // FIX 6: use closeZoom (pauses video first)
        >
          <div
            className="relative w-full max-w-4xl mx-4 rounded-2xl overflow-hidden bg-black shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
              onClick={closeZoom} // FIX 6: use closeZoom
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            {/* FIX 6: ref attached so closeZoom can pause before unmounting */}
            <video
              ref={zoomVideoRef}
              className="w-full aspect-video object-contain"
              src={zoomItem.url}
              autoPlay
              controls
              playsInline
              preload="metadata"
            />

            <div className="flex items-center justify-between gap-4 px-4 py-3 bg-zinc-900">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{zoomItem.name}</p>
                <p className="truncate text-xs text-white/50">
                  {zoomItem.__categoryName} · {zoomItem.__subcategoryName}
                </p>
              </div>
              <Button
                size="sm"
                className="shrink-0"
                onClick={() => handleDownload(zoomItem)}
                disabled={downloadingKey === String(zoomItem.id)}
              >
                {downloadingKey === String(zoomItem.id) ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Download
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Guest auth prompt ── */}
      <Dialog open={guestPromptOpen} onOpenChange={setGuestPromptOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl">
              {guestDownloads >= GUEST_DOWNLOAD_LIMIT ? 'Free limit reached' : 'Sign in to import'}
            </DialogTitle>
            <DialogDescription className="mt-1.5">
              {guestDownloads >= GUEST_DOWNLOAD_LIMIT
                ? "You've used your free download. Sign in or create a free account to download unlimited b-roll footage."
                : 'Create a free account or sign in to import b-roll footage directly into your projects.'}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 flex flex-col gap-3">
            <Link
              to="/signup"
              search={{ redirect: '/brolls' }}
              onClick={() => setGuestPromptOpen(false)}
            >
              <Button className="w-full" size="lg">
                Sign Up — it&apos;s free
              </Button>
            </Link>
            <Link
              to="/login"
              search={{ redirect: '/brolls' }}
              onClick={() => setGuestPromptOpen(false)}
            >
              <Button variant="outline" className="w-full" size="lg">
                Log In
              </Button>
            </Link>
          </div>
          <p className="mt-1 text-center text-xs text-muted-foreground">
            Free accounts get unlimited downloads and project imports.
          </p>
        </DialogContent>
      </Dialog>

      <Dialog
        open={projectPickerOpen}
        onOpenChange={(open) => {
          if (fixedProjectId) return;
          setProjectPickerOpen(open);
        }}
      >
        <DialogContent className="max-w-md" hideCloseButton={Boolean(fixedProjectId)}>
          <DialogHeader>
            <DialogTitle>Select project</DialogTitle>
            <DialogDescription>Pick a project to work with.</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <div className="text-sm font-medium">Project</div>
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger>
                <SelectValue
                  placeholder={projects.length ? 'Select a project…' : 'No projects available'}
                />
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
              <div className="text-xs text-muted-foreground">
                Create a project first from the Projects page.
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setProjectPickerOpen(false)}
              disabled={!selectedProjectId}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <footer className="border-t border-border px-6 py-8" />
    </div>
  );
}

// ─── BrollCard ────────────────────────────────────────────────────────────────
// FIX 1: The download button was nested inside a <button> (the thumbnail wrapper),
// which is invalid HTML — browsers auto-repair it by ejecting the inner button,
// breaking stopPropagation and causing every download click to also open the modal.
// Fixed by converting the outer wrapper to a <div role="button"> so interactive
// content can be legitimately nested inside it.

const BrollCard = memo(function BrollCard({
  item,
  downloading,
  onDownload,
  onPlay,
}: {
  item: BrollItemWithMeta;
  downloading: boolean;
  onDownload: (item: BrollItemWithMeta) => void;
  onPlay: (item: BrollItemWithMeta) => void;
}) {
  const thumb = item.thumbnail_url || (item.type === 'image' ? item.url : null);

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 text-left">
      {/* FIX 1: Changed from <button> to <div role="button"> to allow the
          download <button> to be a valid nested interactive element. */}
      <div
        role="button"
        tabIndex={0}
        className="relative aspect-video w-full overflow-hidden bg-muted block cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        onClick={() => onPlay(item)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onPlay(item);
          }
        }}
        aria-label={`Play "${item.name}"`}
      >
        {thumb ? (
          <img
            src={thumb}
            alt={item.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-muted-foreground">
            <div className="flex flex-col items-center gap-2 text-sm">
              <Play className="h-8 w-8 opacity-30" />
              <span className="text-xs opacity-50">No thumbnail</span>
            </div>
          </div>
        )}

        {item.type === 'video' && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 backdrop-blur-sm">
            <Play className="h-3 w-3 fill-white text-white" />
            <span className="text-[10px] font-medium text-white">Video</span>
          </div>
        )}

        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-200 group-hover:bg-black/30">
          {item.type === 'video' && (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 opacity-0 transition-opacity duration-200 group-hover:opacity-100 backdrop-blur-sm">
              <Play className="h-6 w-6 fill-white text-white" />
            </div>
          )}
        </div>

        {/* Download overlay — now a valid <button> inside a <div role="button"> */}
        <div className="absolute bottom-0 left-0 right-0 p-3 pointer-events-none opacity-0 translate-y-1 transition-all duration-200 group-hover:pointer-events-auto group-hover:opacity-100 group-hover:translate-y-0">
          <div className="flex items-end justify-end gap-2">
            <button
              type="button"
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/10 bg-black/50 px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/65 disabled:cursor-not-allowed disabled:opacity-70"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation(); // Now works correctly — not inside another <button>
                onDownload(item);
              }}
              disabled={downloading}
              title={`Download "${item.name}"`}
            >
              {downloading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              {downloading ? 'Downloading…' : 'Download'}
            </button>
          </div>
        </div>
      </div>

      <div className="px-3 py-2.5">
        <p className="truncate text-sm font-medium leading-snug text-foreground">{item.name}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.__subcategoryName}</p>
      </div>
    </div>
  );
});

// ─── HeroVideo ────────────────────────────────────────────────────────────────
// The hero video used to mount with `autoPlay`, which overrides `preload="none"`
// and makes the browser start downloading video bytes alongside the library API.
// We now render the <video> element immediately (so it always appears in the
// DOM) but defer playback: no `autoPlay`, `preload="none"`, and we only call
// .play() after a short delay. That preserves the bandwidth saving of the
// deferred-load idea without any way for the element to fail to appear in prod.

function HeroVideo({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const t = window.setTimeout(() => {
      const v = ref.current;
      if (!v) return;
      // Muted + playsInline videos are allowed to play programmatically in all
      // modern browsers. We swallow any rejection in case a browser policy
      // blocks it — the visible poster frame is still there as a fallback.
      void v.play().catch(() => {});
    }, 1200);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <video
      ref={ref}
      className="absolute inset-0 h-full w-full object-cover"
      src={src}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden="true"
    />
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

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

// ─── SubcategoryFilters ───────────────────────────────────────────────────────
// FIX 8: The overflow <Select> was duplicating items already shown as visible
// pills (AI, General). Fixed by only rendering items in the overflow dropdown
// that are not already rendered as visible pill buttons above.

function SubcategoryFilters({
  items,
  selectedCategoryId,
  selectedSubcategoryId,
  onChange,
}: {
  items: BrollItemWithMeta[];
  selectedCategoryId: number | 'all';
  selectedSubcategoryId: number | 'all' | 'ai' | 'general';
  onChange: (id: number | 'all' | 'ai' | 'general') => void;
}) {
  const subs = useMemo(() => {
    const map = new Map<number, string>();
    for (const it of items) {
      if (selectedCategoryId !== 'all' && it.__categoryId !== selectedCategoryId) continue;
      map.set(it.__subcategoryId, it.__subcategoryName);
    }
    const all = [...map.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const ai = all.filter((s) => /ai/i.test(s.name));
    const general = all.filter((s) => /general/i.test(s.name));
    const rest = all.filter((s) => !/ai/i.test(s.name) && !/general/i.test(s.name));
    return [
      ...(ai.length ? [{ id: 'ai' as const, name: 'AI' }] : []),
      ...(general.length ? [{ id: 'general' as const, name: 'General' }] : []),
      ...rest,
    ];
  }, [items, selectedCategoryId]);

  // Items shown as visible pill buttons (always rendered regardless of overflow)
  const visiblePills = subs.slice(0, 7);
  // IDs of items already shown as pills — used to de-duplicate the overflow dropdown
  const visiblePillIds = new Set(visiblePills.map((s) => String(s.id)));
  // FIX 8: Only items NOT already rendered as pills go into the overflow select
  const overflowItems = subs.slice(7).filter((s) => !visiblePillIds.has(String(s.id)));

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => onChange('all')}
        className={[
          'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors',
          selectedSubcategoryId === 'all'
            ? 'border-primary/40 bg-primary/10 text-primary'
            : 'border-border bg-background/50 hover:bg-muted/40',
        ].join(' ')}
      >
        <Search className="h-4 w-4" />
        All
      </button>
      {visiblePills.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => onChange(s.id)}
          className={[
            'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors',
            selectedSubcategoryId === s.id
              ? 'border-primary/40 bg-primary/10 text-primary'
              : 'border-border bg-background/50 hover:bg-muted/40',
          ].join(' ')}
        >
          <Search className="h-4 w-4" />
          {s.name}
        </button>
      ))}
      {/* FIX 8: Only render the overflow select when there are truly extra items */}
      {overflowItems.length > 0 ? (
        <Select
          value={
            // Only show a value in the select if the active filter is one of the overflow items
            overflowItems.some((s) => String(s.id) === String(selectedSubcategoryId))
              ? String(selectedSubcategoryId)
              : ''
          }
          onValueChange={(v) =>
            onChange(
              v === 'all' ? 'all' : v === 'ai' ? 'ai' : v === 'general' ? 'general' : Number(v),
            )
          }
        >
          <SelectTrigger className="h-9 w-[140px] rounded-full bg-background/50">
            <SelectValue placeholder="More…" />
          </SelectTrigger>
          <SelectContent className="w-[220px] max-h-64 overflow-y-auto">
            {overflowItems.map((s) => (
              <SelectItem key={s.id} value={String(s.id)}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
    </div>
  );
}