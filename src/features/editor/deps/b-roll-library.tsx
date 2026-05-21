import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ChevronRight,
  Clapperboard,
  Loader2,
  Plus,
  Search,
  X,
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { cn } from '@/shared/ui/cn';
import { createLogger } from '@/shared/logging/logger';
import {
  fetchBrollLibrary,
  suggestedFileNameForBroll,
  BrollApiError,
  type BrollCategory,
  type BrollLibraryItem,
  type BrollSubcategory,
} from '@/features/editor/services/broll-library-api';
import {
  getMediaType,
  mediaLibraryService,
  useMediaLibraryStore,
} from '@/features/editor/deps/media-library';
import { useProjectStore } from '@/features/editor/deps/projects';
import { useTimelineStore } from '@/features/editor/deps/timeline-store';
import { buildTimelineItemsForMediaOnTrack } from '@/features/editor/deps/timeline-utils';
import { usePlaybackStore } from '@/shared/state/playback';
import { useSelectionStore } from '@/shared/state/selection';

const logger = createLogger('BRollLibrary');

function pickTargetTrackIdForImport(): string | null {
  const { tracks } = useTimelineStore.getState();
  const { activeTrackId } = useSelectionStore.getState();

  const isUsable = (t: (typeof tracks)[number]) =>
    t.visible !== false && !t.locked && !t.isGroup;

  let target = activeTrackId
    ? tracks.find((t) => t.id === activeTrackId && isUsable(t))
    : null;
  if (!target) {
    target = tracks.find((t) => isUsable(t));
  }
  return target?.id ?? null;
}

export const BRollLibrary = memo(function BRollLibrary() {
  const currentProjectId = useProjectStore((s) => s.currentProject?.id ?? null);
  const loadMediaItems = useMediaLibraryStore((s) => s.loadMediaItems);
  const showNotification = useMediaLibraryStore((s) => s.showNotification);

  const [categories, setCategories] = useState<BrollCategory[]>([]);
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [addingKey, setAddingKey] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoadState('loading');
    setLoadError(null);
    void (async () => {
      try {
        const data = await fetchBrollLibrary();
        if (!cancelled) {
          setCategories(data);
          setLoadState('ok');
        }
      } catch (e) {
        if (cancelled) return;
        const message = e instanceof BrollApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : 'Failed to load b-roll library.';
        setLoadError(message);
        setLoadState('error');
        logger.warn('B-roll library load failed', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredCategories = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;

    const matches = (s: string | null | undefined) => (s ?? '').toLowerCase().includes(q);

    return categories
      .map((cat) => {
        const catMatch = matches(cat.name);
        const subcategories = (cat.subcategories ?? [])
          .map((sub) => {
            const subMatch = matches(sub.name);
            const items = (sub.items ?? []).filter(
              (it) => subMatch || catMatch || matches(it.name) || matches(it.description)
            );
            return { ...sub, items };
          })
          .filter((sub) => (sub.items ?? []).length > 0);

        return { ...cat, subcategories };
      })
      .filter((cat) => (cat.subcategories ?? []).length > 0);
  }, [categories, query]);

  const filteredCount = useMemo(() => {
    let count = 0;
    for (const cat of filteredCategories) {
      for (const sub of cat.subcategories ?? []) {
        count += (sub.items ?? []).length;
      }
    }
    return count;
  }, [filteredCategories]);

  const handleAddItem = useCallback(
    (item: BrollLibraryItem) => {
      if (!currentProjectId) {
        showNotification({ type: 'warning', message: 'Open or create a project to import b-roll.' });
        return;
      }

      const key = `${item.id}`;
      setAddingKey(key);

      void (async () => {
        try {
          const res = await fetch(item.url, { mode: 'cors', credentials: 'omit' });
          if (!res.ok) {
            throw new Error(`Download failed (${res.status})`);
          }
          const blob = await res.blob();
          const fileName = suggestedFileNameForBroll(item.name);
          const mime = blob.type || (item.type === 'video' ? 'video/mp4' : 'image/jpeg');
          const file = new File([blob], fileName, { type: mime });

          const meta = await mediaLibraryService.importMediaFromFile(file, currentProjectId, {
            tags: ['b-roll'],
          });

          await loadMediaItems();

          const mediaType = getMediaType(meta.mimeType);
          if (mediaType === 'unknown') {
            showNotification({
              type: 'warning',
              message: `"${meta.fileName}" was saved to media, but its type is not supported on the timeline.`,
            });
            return;
          }

          const trackId = pickTargetTrackIdForImport();
          if (!trackId) {
            showNotification({
              type: 'warning',
              message: 'Media was imported, but no unlocked track is available to place a clip.',
            });
            return;
          }

          const currentProject = useProjectStore.getState().currentProject;
          const canvasWidth = currentProject?.metadata.width ?? 1920;
          const canvasHeight = currentProject?.metadata.height ?? 1080;

          const timelineItems = await buildTimelineItemsForMediaOnTrack(
            [
              {
                media: meta,
                mediaId: meta.id,
                mediaType,
                label: meta.fileName,
              },
            ],
            {
              trackId,
              dropFrame: usePlaybackStore.getState().currentFrame,
              fps: useTimelineStore.getState().fps,
              canvasWidth,
              canvasHeight,
              existingItems: useTimelineStore.getState().items,
            }
          );

          if (timelineItems.length === 0) {
            showNotification({
              type: 'warning',
              message: 'Media was imported, but there is no room on the target track at the playhead.',
            });
            return;
          }

          const placed = timelineItems[0]!;
          useTimelineStore.getState().addItem(placed);
          useSelectionStore.getState().setActiveTrack(trackId);
          useSelectionStore.getState().selectItems([placed.id]);

          if (meta.isDuplicate) {
            showNotification({
              type: 'info',
              message: `"${meta.fileName}" was already in the library — added another clip at the playhead.`,
            });
          } else {
            showNotification({
              type: 'success',
              message: `Imported "${meta.fileName}" to media and timeline.`,
            });
          }
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'Import failed.';
          showNotification({ type: 'error', message: msg });
          logger.warn('B-roll import failed', e);
        } finally {
          setAddingKey(null);
        }
      })();
    },
    [currentProjectId, loadMediaItems, showNotification]
  );

  if (loadState === 'loading') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="text-xs">Loading b-roll library…</span>
      </div>
    );
  }

  if (loadState === 'error' && loadError) {
    return (
      <div className="flex flex-1 flex-col gap-2 p-4 text-sm text-muted-foreground">
        <div className="flex items-start gap-2 rounded-lg border border-border bg-secondary/30 p-3">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
          <div>
            <p className="font-medium text-foreground">Could not load b-roll</p>
            <p className="mt-1 text-xs leading-relaxed">{loadError}</p>
          </div>
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center text-muted-foreground">
        <Clapperboard className="h-8 w-8 opacity-40" />
        <p className="text-xs">No categories yet. Add categories and clips in Cutflow, then refresh.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto p-2">
      <div className="sticky top-0 z-10 -mx-2 mb-2 bg-background/80 px-2 pb-2 pt-2 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search b-roll…"
            className="h-9 pl-9 pr-9 text-sm"
            aria-label="Search b-roll"
          />
          {query.trim().length > 0 && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              aria-label="Clear search"
              title="Clear"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {query.trim().length > 0 && (
          <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
            <span>{filteredCount} result{filteredCount === 1 ? '' : 's'}</span>
            {filteredCount === 0 && <span>No matches</span>}
          </div>
        )}
      </div>

      {filteredCategories.map((cat) => (
        <CategoryBlock
          key={cat.id}
          category={cat}
          onAddItem={handleAddItem}
          addingKey={addingKey}
        />
      ))}
    </div>
  );
});

function CategoryBlock({
  category,
  onAddItem,
  addingKey,
}: {
  category: BrollCategory;
  onAddItem: (item: BrollLibraryItem) => void;
  addingKey: string | null;
}) {
  const [open, setOpen] = useState(true);
  const subs = category.subcategories ?? [];

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border-b border-border/60 last:border-0">
      <CollapsibleTrigger
        className="flex w-full items-center gap-1 py-2 text-left hover:bg-secondary/40 rounded-md px-1 -mx-1"
      >
        <ChevronRight
          className={cn('h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform', open && 'rotate-90')}
        />
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {category.name}
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pb-2 pl-1 space-y-1">
          {subs.length === 0 ? (
            <p className="text-[10px] text-muted-foreground pl-5 py-1">No subcategories</p>
          ) : (
            subs.map((sub) => (
              <SubcategoryBlock
                key={sub.id}
                sub={sub}
                onAddItem={onAddItem}
                addingKey={addingKey}
              />
            ))
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function SubcategoryBlock({
  sub,
  onAddItem,
  addingKey,
}: {
  sub: BrollSubcategory;
  onAddItem: (item: BrollLibraryItem) => void;
  addingKey: string | null;
}) {
  const [open, setOpen] = useState(false);
  const items = sub.items ?? [];

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        className="flex w-full items-center gap-1 py-1.5 pl-4 pr-1 text-left rounded-md hover:bg-secondary/30"
      >
        <ChevronRight
          className={cn('h-3 w-3 shrink-0 text-muted-foreground transition-transform', open && 'rotate-90')}
        />
        <span className="text-xs text-foreground/90">{sub.name}</span>
        <span className="text-[10px] text-muted-foreground">({items.length})</span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="grid grid-cols-2 gap-1.5 pl-7 pr-1 pb-2 pt-1">
          {items.map((item) => (
            <BrollTile
              key={item.id}
              item={item}
              busy={addingKey === String(item.id)}
              onAdd={() => onAddItem(item)}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function BrollTile({
  item,
  busy,
  onAdd,
}: {
  item: BrollLibraryItem;
  busy: boolean;
  onAdd: () => void;
}) {
  return (
    <div className="group relative flex flex-col rounded-md border border-border bg-secondary/20 overflow-hidden">
      <div className="relative aspect-video bg-muted">
        <img
          src={item.thumbnail_url || item.url}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
        />
        {item.is_premium && (
          <span className="absolute top-1 right-1 rounded bg-amber-500/90 px-1 py-0.5 text-[8px] font-semibold text-black">
            Pro
          </span>
        )}
      </div>
      <div className="flex items-start gap-1 p-1.5">
        <p className="min-h-8 flex-1 text-[9px] leading-tight text-muted-foreground line-clamp-3 group-hover:text-foreground">
          {item.name}
        </p>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAdd();
          }}
          disabled={busy}
          className="shrink-0 rounded border border-border bg-background/80 p-1 text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary disabled:opacity-50"
          title="Download, add to media, and place at playhead"
        >
          {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
        </button>
      </div>
    </div>
  );
}
