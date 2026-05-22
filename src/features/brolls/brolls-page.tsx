import { Link } from '@tanstack/react-router';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  LayoutDashboard,
  Loader2,
  LogOut,
  Play,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import { FreeCutLogo } from '@/components/brand/freecut-logo';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { Button } from '@/components/ui/button';
import {
  BrollLibraryHeaderSearchAnchor,
  BrollLibraryHeroSearch,
} from '@/features/brolls/components/broll-library-search';
import { BrollFiltersPanel, BrollFiltersToggle, GRADIENT_BTN } from '@/features/brolls/components/broll-filters';
import {
  EMPTY_BROLL_FILTERS,
  countBrollFilters,
  matchesBrollFilters,
  type BrollFilterValues,
} from '@/features/brolls/components/broll-filter-model';
import { useCursorSpotlight } from '@/features/brolls/components/use-cursor-spotlight';
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
import { useTheme } from '@/shared/theme/use-theme';

const HERO_BACKGROUND_VIDEOS = [
  '/assets/hero/stbg.mp4',
  // '/assets/hero/0109-53-3banec400z_1080__D.mp4',
  // '/assets/hero/66b22d2406b4320c51ed519e-lpt-sbpbxg_1080__D.mp4',
  // '/assets/hero/hero.mp4',
  // '/assets/hero/sunny-view-of-miami-beach-florida-usa-on-hot-day-2025-08-29-02-31-26-utc-r6hjf3xm43_1080__D.mp4',
] as const;

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
  items: BrollItemWithMeta[];
};

function processLibrary(lib: RawCategory[]): ProcessedLibrary {
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
  return { items: flat };
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

function HeroVideoBackground() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % HERO_BACKGROUND_VIDEOS.length);
    }, 7000);
    return () => window.clearInterval(timer);
  }, []);

  const advance = useCallback(() => {
    setActiveIndex((index) => (index + 1) % HERO_BACKGROUND_VIDEOS.length);
  }, []);

  return (
    <video
      key={HERO_BACKGROUND_VIDEOS[activeIndex]}
      className="absolute inset-0 h-full w-full object-cover opacity-75"
      src={HERO_BACKGROUND_VIDEOS[activeIndex]}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden="true"
      onError={advance}
    />
  );
}

function triggerDirectAssetDownload(item: BrollLibraryItem) {
  const a = document.createElement('a');
  a.href = item.url;
  a.download = suggestedFileNameForBroll(item.name);
  a.rel = 'noreferrer';
  a.target = '_blank';
  document.body.appendChild(a);
  try {
    a.click();
  } finally {
    a.remove();
  }
}

export function BrollsPage({ fixedProjectId }: { fixedProjectId?: string }) {
  const { theme: themeMode, isDark: isDarkTheme } = useTheme();

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
  const [appliedFilters, setAppliedFilters] =
    useState<BrollFilterValues>(EMPTY_BROLL_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const activeFilterCount = useMemo(() => countBrollFilters(appliedFilters), [appliedFilters]);

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
  // const effectiveProjectId = fixedProjectId || selectedProjectId;

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
        const [lib] = await Promise.all([fetchBrollLibrary(appliedFilters), loadProjects()]);
        if (cancelled) return;

        const processed = processLibrary(lib as RawCategory[]);
        const nextFp = fingerprintLibrary(processed.items);

        // Identical library → don't reshuffle the visible grid.
        if (nextFp === renderedFingerprintRef.current && initialFromCache) {
          return;
        }
        renderedFingerprintRef.current = nextFp;
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
  }, [loadProjects, initialFromCache, appliedFilters]);

  useEffect(() => {
    if (fixedProjectId) return;
    if (selectedProjectId) return;
    const preferred = currentProject?.id || projects[0]?.id || '';
    if (preferred) setSelectedProjectId(preferred);
  }, [currentProject?.id, fixedProjectId, projects, selectedProjectId]);

  // const projectName = useMemo(() => {
  //   const pid = effectiveProjectId;
  //   if (!pid) return null;
  //   return projects.find((p) => p.id === pid)?.name ?? null;
  // }, [effectiveProjectId, projects]);

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    return items.filter((it) => {
      if (q) {
        const hay = [
          it.name ?? '',
          it.description ?? '',
          it.__categoryName ?? '',
          it.__subcategoryName ?? '',
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }

      return matchesBrollFilters(it, appliedFilters);
    });
  }, [items, debouncedQuery, appliedFilters]);

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

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, appliedFilters]);

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
        const fileName = suggestedFileNameForBroll(item.name);
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
        triggerDirectAssetDownload(item);
        if (!isAuthenticated) {
          const next = guestDownloads + 1;
          try {
            localStorage.setItem('brolls_guest_downloads', String(next));
          } catch {
            // Ignore storage errors (private mode, quota exceeded)
          }
          if (mountedRef.current) setGuestDownloads(next);
        }
        if (mountedRef.current) {
          toast.info('Opening download', {
            description: msg.includes('Failed to fetch')
              ? 'The video server blocks in-page downloads, so the file is opening directly.'
              : 'The file is opening directly because the in-page download could not finish.',
          });
        }
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

  const headerSearchAnchorRef = useRef<HTMLDivElement>(null);

  return (
    <div
      data-theme={themeMode}
      className={[
        'brolls-page [&_a]:cursor-pointer [&_button]:cursor-pointer [&_[role=button]:not(:disabled)]:cursor-pointer [&_label]:cursor-pointer',
        isDarkTheme ? 'min-h-screen bg-[#080808] text-white' : 'min-h-screen bg-white text-[#1f1f1f]',
      ].join(' ')}
    >
      {/* ── Header ── */}
      <header className="broll-navbar cutflow-top-nav sticky top-0 z-50 border-b border-white/10 text-white">
        <div className="mx-auto flex max-w-[1400px] items-center gap-2 px-2 py-3 sm:gap-4 sm:px-4 sm:py-4 lg:px-6">
          <div className="flex items-center gap-4 min-w-0">
            <a href="/" className="shrink-0" aria-label="Reload site">
              <FreeCutLogo
                variant="full"
                size="md"
                className="hover:opacity-80 transition-opacity"
              />
            </a>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold leading-none tracking-tight sm:text-[15px]">
                <span className="text-white">Cutflow</span>
                <span className="bg-gradient-to-r from-[#fb0302] via-[#fd8b0c] to-[#fee51b] bg-clip-text text-transparent">
                  {' '}
                  Video Library
                </span>
              </p>
              {/* <div className="text-xs text-muted-foreground truncate">
                Choose a project to import into
              </div> */}
            </div>
          </div>

          <BrollLibraryHeaderSearchAnchor anchorRef={headerSearchAnchorRef} />

          <div className="flex shrink-0 items-center gap-2">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/20 bg-transparent text-white hover:bg-white hover:text-[#111]"
                  >
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
                <div className="ml-1 flex items-center gap-2 border-l border-white/15 pl-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-semibold text-[#111]">
                    {user?.firstName?.[0]?.toUpperCase() ??
                      user?.email?.[0]?.toUpperCase() ?? <User className="h-4 w-4" />}
                  </div>
                  <span className="hidden max-w-[120px] truncate text-sm font-medium text-white sm:block">
                    {user?.firstName ?? user?.email?.split('@')[0]}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white/70 hover:bg-white/10 hover:text-white"
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
                  <Button
                    variant="outline"
                    size="sm"
                    className="broll-nav-auth-btn broll-nav-auth-btn--login relative overflow-hidden border-white/20 bg-transparent text-white hover:bg-transparent hover:text-white"
                  >
                    <span className="relative z-[1]">Log In</span>
                  </Button>
                </Link>
                <Link to="/signup" search={{ redirect: '/brolls' }}>
                  <Button
                    size="sm"
                    className="broll-nav-auth-btn broll-nav-auth-btn--signup relative overflow-hidden border-0 bg-white text-[#111] hover:bg-white hover:text-[#111]"
                  >
                    <span className="relative z-[1]">Sign Up Free</span>
                  </Button>
                </Link>
              </>
            )}
            <ThemeToggle compact className="ml-1" />
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <div className="relative overflow-hidden border-b border-[#e6e6e6] bg-[#111]">
        <HeroVideoBackground />
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/20 to-black/45" />
        <div className="relative mx-auto flex min-h-[520px] max-w-[1400px] flex-col items-center justify-center px-4 pb-16 pt-24 sm:min-h-[560px] sm:px-6 sm:pb-20 sm:pt-28 lg:min-h-[600px] lg:px-8">
          <div className="w-full max-w-5xl">
            <BrollLibraryHeroSearch
              query={query}
              onQueryChange={setQuery}
              searchKind={searchKind}
              onSearchKindChange={setSearchKind}
              headerAnchorRef={headerSearchAnchorRef}
              themeMode={themeMode}
              resultsMeta={
                <>
                  <span className="text-xs text-white/80">
                    {isLoading
                      ? 'Loading b-roll…'
                      : `${filtered.length.toLocaleString()} results`}
                  </span>
                  {query && !isLoading && (
                    <button
                      type="button"
                      onClick={() => {
                        setQuery('');
                        setPage(1);
                      }}
                      className="text-xs font-medium text-white/70 underline hover:text-white"
                    >
                      Clear search
                    </button>
                  )}
                </>
              }
            />
          </div>
        </div>
      </div>

      {/* ── Main grid ── */}
      <main
        className={[
          'mx-auto max-w-[1680px] px-4 py-8 sm:px-6 lg:px-8',
          isDarkTheme ? 'bg-[#080808]' : 'bg-white',
        ].join(' ')}
      >
        {error && (
          <div className="max-w-3xl mx-auto mb-8">
            <Alert variant="destructive">
              <div className="font-semibold leading-none tracking-tight">Couldn't load b-roll</div>
              <AlertDescription className="mt-2">{error}</AlertDescription>
            </Alert>
          </div>
        )}

        <div className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-3 pb-1">
            <div>
              <h2
                className={[
                  'text-2xl font-semibold tracking-tight sm:text-3xl',
                  isDarkTheme ? 'text-white' : 'text-[#111]',
                ].join(' ')}
              >
                Recently Added
              </h2>
              <p className={isDarkTheme ? 'mt-1 text-sm text-white/60' : 'mt-1 text-sm text-[#666]'}>
                {isLoading
                  ? 'Loading b-roll…'
                  : `${filtered.length.toLocaleString()} results matching your criteria`}
              </p>
            </div>
            <BrollFiltersToggle
              open={filtersOpen}
              onOpenChange={setFiltersOpen}
              activeCount={activeFilterCount}
              themeMode={themeMode}
            />
          </div>

          <BrollFiltersPanel
            open={filtersOpen}
            value={appliedFilters}
            onApply={setAppliedFilters}
            activeCount={activeFilterCount}
            themeMode={themeMode}
          />

          {isLoading ? (
            <BrollGridSkeleton themeMode={themeMode} />
          ) : filtered.length === 0 ? (
            <div
              className={[
                'rounded-lg border p-10 text-center shadow-sm',
                isDarkTheme ? 'border-white/10 bg-[#101010]' : 'border-[#dddddd] bg-white',
              ].join(' ')}
            >
              <div className="text-lg font-semibold">No matches</div>
              <div className={isDarkTheme ? 'mt-2 text-sm text-white/60' : 'mt-2 text-sm text-[#666]'}>
                Try a different search term or filter.
              </div>
            </div>
          ) : (
            <div className="grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {pageItems.map((it) => (
                <BrollCard
                  key={it.id}
                  item={it}
                  downloading={downloadingKey === String(it.id)}
                  onDownload={handleDownload}
                  themeMode={themeMode}
                />
              ))}
            </div>
          )}

            {/* FIX 9: Unified pagination — removed the redundant centred "Next page"
                text button. Navigation is now exclusively handled by the icon buttons
                and the page counter on the right, which is consistent and unambiguous. */}
            {!isLoading && filtered.length > 0 && pageCount > 1 ? (
              <div className="flex items-center justify-end gap-2">
                <div className="hidden items-center gap-2 sm:flex">
                  <div className={isDarkTheme ? 'text-xs text-white/60' : 'text-xs text-[#666]'}>Per page</div>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(v) => setPageSize(Number(v) as 15 | 30 | 60)}
                  >
                    <SelectTrigger
                      className={[
                        'h-9 w-[90px]',
                        isDarkTheme ? 'border-white/15 bg-[#101010] text-white' : 'border-[#d6d6d6] bg-white text-[#111]',
                      ].join(' ')}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent
                      className={isDarkTheme ? 'border-white/15 bg-[#101010] text-white' : 'border-[#d6d6d6] bg-white text-[#111]'}
                    >
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
                  className={
                    isDarkTheme
                      ? 'border-white/15 bg-[#101010] text-white hover:bg-white/10'
                      : 'border-[#d6d6d6] bg-white text-[#111] hover:bg-[#f2f2f2]'
                  }
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className={isDarkTheme ? 'hidden px-1 text-xs text-white/60 sm:block' : 'hidden px-1 text-xs text-[#666] sm:block'}>
                  Page {page} of {pageCount}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={page >= pageCount}
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  aria-label="Next page"
                  className={
                    isDarkTheme
                      ? 'border-white/15 bg-[#101010] text-white hover:bg-white/10'
                      : 'border-[#d6d6d6] bg-white text-[#111] hover:bg-[#f2f2f2]'
                  }
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            ) : null}
        </div>
      </main>

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

      <footer
        className={[
          'border-t px-6 py-8',
          isDarkTheme ? 'border-white/10 bg-[#080808]' : 'border-[#e6e6e6] bg-white',
        ].join(' ')}
      />
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
  themeMode,
}: {
  item: BrollItemWithMeta;
  downloading: boolean;
  onDownload: (item: BrollItemWithMeta) => void;
  themeMode: 'light' | 'dark';
}) {
  const isDark = themeMode === 'dark';
  const thumb = item.thumbnail_url || (item.type === 'image' ? item.url : null);

  // Hover-to-preview: mount a <video> pointed at the full asset URL and let
  // the browser handle progressive streaming via native byte-range requests.
  const [hovered, setHovered] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  // Once the video starts playing we lock the spinner off — otherwise
  // subsequent `loadstart` events (which fire on every byte-range chunk for
  // .mov files and on every loop iteration) would flicker the spinner back on
  // and make it look like the video is perpetually loading instead of playing.
  const hasPlayedRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (item.type !== 'video' || !hovered) return;
    const v = videoRef.current;
    if (!v) return;
    setPreviewLoading(true);
    hasPlayedRef.current = false;
    // React sets the `muted` content attribute but not always the IDL property
    // before the first frame, which makes Chrome's autoplay policy reject
    // play() with NotAllowedError. Force the property here so muted-autoplay
    // is reliably allowed.
    v.muted = true;
    void v.play().catch(() => {
      // Silently ignore — the user can scroll/hover to retry. We don't surface
      // an error because the most common rejection (AbortError when hover ends
      // before play resolves) is benign.
    });
  }, [hovered, item.type]);

  const { rootRef, active, setActive, spotStyle, setSpotFromEvent } =
    useCursorSpotlight<HTMLDivElement>();

  return (
    <div
      ref={rootRef}
      style={spotStyle}
      onPointerMove={setSpotFromEvent}
      onPointerEnter={(e) => {
        setActive(true);
        setSpotFromEvent(e);
        if (item.type === 'video') setHovered(true);
      }}
      onPointerLeave={() => {
        setActive(false);
        setHovered(false);
      }}
      className={[
        'broll-card-spotlight group relative isolate overflow-hidden rounded-md border border-transparent text-left',
        isDark ? 'bg-[#101010]' : 'bg-white',
        active && 'is-spotlight-active',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div
        className={[
          'relative z-[3] aspect-video w-full overflow-hidden rounded-md block',
          isDark ? 'bg-[#181818]' : 'bg-[#ededed]',
        ].join(' ')}
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
          <div className={isDark ? 'absolute inset-0 grid place-items-center text-white/50' : 'absolute inset-0 grid place-items-center text-[#777]'}>
            <div className="flex flex-col items-center gap-2 text-sm">
              <Play className="h-8 w-8 opacity-30" />
              <span className="text-xs opacity-50">No thumbnail</span>
            </div>
          </div>
        )}

        {item.type === 'video' && !hovered && (
          <div
            className="absolute left-2 top-2 flex h-9 w-9 items-center justify-center text-white"
            aria-hidden="true"
          >
            <i className="bi bi-play-btn" />
          </div>
        )}

        {item.type === 'video' && hovered ? (
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover"
            src={item.url}
            muted
            playsInline
            loop
            autoPlay
            preload="auto"
            controls={false}
            aria-hidden="true"
            onCanPlay={() => {
              if (!hasPlayedRef.current) {
                hasPlayedRef.current = true;
                setPreviewLoading(false);
              }
            }}
            onPlaying={() => {
              hasPlayedRef.current = true;
              setPreviewLoading(false);
            }}
            onError={() => setPreviewLoading(false)}
          />
        ) : null}

        {item.type === 'video' && hovered && previewLoading ? (
          <div className="absolute inset-0 grid place-items-center bg-black/20">
            <div className="inline-flex items-center gap-2 rounded-full bg-black/45 px-3 py-1.5 text-xs text-white backdrop-blur-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          </div>
        ) : null}

        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-200 group-hover:bg-black/30">
          {item.type === 'video' && !hovered && (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 opacity-0 transition-opacity duration-200 group-hover:opacity-100 backdrop-blur-sm">
              <Play className="h-6 w-6 fill-white text-white" />
            </div>
          )}
        </div>

        {/* Download overlay — uses cursor-spotlight for the same hover glow as the search bar */}
        <div className="absolute bottom-0 left-0 right-0 p-3 pointer-events-none opacity-0 translate-y-1 transition-all duration-200 group-hover:pointer-events-auto group-hover:opacity-100 group-hover:translate-y-0">
          <div className="flex items-end justify-end gap-2">
            <DownloadButton
              downloading={downloading}
              onClick={() => onDownload(item)}
              title={item.name}
            />
          </div>
        </div>
      </div>
    </div>
  );
});

// ─── DownloadButton ───────────────────────────────────────────────────────────
// Reuses the same cursor-following spotlight glow as the hero search bar so the
// download CTA on every video feels visually consistent with the rest of the UI.

function DownloadButton({
  downloading,
  onClick,
  title,
}: {
  downloading: boolean;
  onClick: () => void;
  title: string;
}) {
  const { rootRef, active, setActive, spotStyle, setSpotFromEvent } =
    useCursorSpotlight<HTMLButtonElement>();

  return (
    <button
      ref={rootRef}
      type="button"
      style={{ ...spotStyle, ['--spot-size' as string]: '110px' }}
      onPointerMove={setSpotFromEvent}
      onPointerEnter={(e) => {
        setActive(true);
        setSpotFromEvent(e);
      }}
      onPointerLeave={() => setActive(false)}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      disabled={downloading}
      title={`Download "${title}"`}
      className={[
        'cursor-spotlight relative isolate inline-flex cursor-pointer items-center gap-1.5 overflow-hidden rounded-full px-3 py-1.5 text-[11px] font-semibold shadow-lg shadow-black/20 disabled:cursor-not-allowed disabled:opacity-70',
        GRADIENT_BTN,
        active && 'is-spotlight-active',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="relative z-10 inline-flex items-center gap-1.5">
        {downloading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Download className="h-3.5 w-3.5" />
        )}
        {downloading ? 'Downloading…' : 'Download'}
      </span>
    </button>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function BrollGridSkeleton({ themeMode }: { themeMode: 'light' | 'dark' }) {
  const isDark = themeMode === 'dark';
  const tiles = Array.from({ length: 12 });
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {tiles.map((_, idx) => (
        <div key={idx} className={isDark ? 'overflow-hidden rounded-md bg-[#101010]' : 'overflow-hidden rounded-md bg-white'}>
          <div
            className={[
              'aspect-video w-full rounded-md relative overflow-hidden',
              isDark ? 'bg-[#181818]' : 'bg-[#ededed]',
            ].join(' ')}
          >
            <div className="absolute inset-0 animate-shimmer opacity-20">
              <div className={isDark ? 'h-full w-1/3 bg-white/20' : 'h-full w-1/3 bg-white/70'} />
            </div>
          </div>
          <div className="p-3 space-y-2">
            <div className={isDark ? 'h-3 w-2/3 rounded bg-white/10' : 'h-3 w-2/3 rounded bg-[#e2e2e2]'} />
            <div className={isDark ? 'h-3 w-1/2 rounded bg-white/10' : 'h-3 w-1/2 rounded bg-[#eeeeee]'} />
          </div>
        </div>
      ))}
    </div>
  );
}
