import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/shared/ui/cn';
import { useCursorSpotlight } from '@/features/brolls/components/use-cursor-spotlight';

function smoothstep(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

function useMorphSearchPosition(
  heroAnchorRef: React.RefObject<HTMLDivElement | null>,
  headerAnchorRef: React.RefObject<HTMLDivElement | null>,
  collapseDistance = 340,
) {
  const [progress, setProgress] = useState(0);
  const [floatingStyle, setFloatingStyle] = useState<CSSProperties>({
    position: 'fixed',
    visibility: 'hidden',
    zIndex: 60,
  });

  useLayoutEffect(() => {
    let raf = 0;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const update = () => {
      const hero = heroAnchorRef.current;
      const header = headerAnchorRef.current;
      if (!hero || !header) return;

      const hr = hero.getBoundingClientRect();
      const nr = header.getBoundingClientRect();
      const canDock = nr.width > 48;
      const raw = canDock ? Math.min(1, Math.max(0, window.scrollY / collapseDistance)) : 0;
      const eased = reducedMotion ? (raw > 0.5 ? 1 : 0) : smoothstep(raw);

      setProgress(eased);
      setFloatingStyle({
        position: 'fixed',
        top: hr.top + (nr.top - hr.top) * eased,
        left: hr.left + (nr.left - hr.left) * eased,
        width: hr.width + (nr.width - hr.width) * eased,
        height: hr.height + (nr.height - hr.height) * eased,
        zIndex: 60,
        visibility: 'visible',
        pointerEvents: 'auto',
      });
    };

    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [heroAnchorRef, headerAnchorRef, collapseDistance]);

  return { progress, floatingStyle };
}

type BrollSearchBarProps = {
  query: string;
  onQueryChange: (value: string) => void;
  searchKind: 'videos';
  onSearchKindChange: (value: 'videos') => void;
  compact: boolean;
  variant: 'hero' | 'header';
  themeMode: 'light' | 'dark';
};

function BrollSearchBar({
  query,
  onQueryChange,
  searchKind,
  onSearchKindChange,
  compact,
  variant,
  themeMode,
}: BrollSearchBarProps) {
  const isHero = variant === 'hero';
  const isDark = themeMode === 'dark';
  const barHeight = compact ? 'h-10' : 'h-[54px]';
  const iconSize = compact ? 'h-4 w-4' : 'h-5 w-5';
  const inputPad = compact ? 'pl-10 pr-10 text-sm' : 'pl-12 pr-12 text-base';
  const iconLeft = compact ? 'left-3' : 'left-4';
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
      }}
      onPointerLeave={() => setActive(false)}
      className={cn(
        'cursor-spotlight group/search relative isolate flex w-full items-center overflow-hidden rounded-md shadow-[0_12px_34px_rgba(0,0,0,0.28)] ring-1 transition-[border-radius,background] duration-300',
        isDark ? 'bg-[#151515] text-white ring-white/15' : 'bg-white text-[#111] ring-black/10',
        active && 'is-spotlight-active',
        !isHero && 'shadow-md',
        barHeight,
      )}
    >
      <div className="relative z-10 flex w-full min-w-0 items-center">
      {!compact && (
        <Select value={searchKind} onValueChange={(v) => onSearchKindChange(v as 'videos')}>
          <SelectTrigger
            className={cn(
              barHeight,
              'w-[120px] rounded-none border-0 border-r shadow-none sm:w-[140px]',
              isDark
                ? 'border-white/15 bg-[#151515] text-white hover:bg-[#202020]'
                : 'border-[#d8d8d8] bg-white text-[#111] hover:bg-[#f7f7f7]',
            )}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent
            className={cn(
              isDark ? 'border-white/15 bg-[#151515] text-white' : 'border-[#d6d6d6] bg-white text-[#111]',
            )}
          >
            <SelectItem value="videos">Videos</SelectItem>
          </SelectContent>
        </Select>
      )}
      <div className="relative min-w-0 flex-1">
        <Search
          className={cn(
            'pointer-events-none absolute top-1/2 -translate-y-1/2',
            iconSize,
            iconLeft,
            isDark ? 'text-white/55' : 'text-[#707070]',
          )}
        />
        <Input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search videos…"
          className={cn(
            barHeight,
            'w-full rounded-none border-0 shadow-none focus-visible:ring-0',
            inputPad,
            isDark ? 'bg-[#151515] text-white placeholder:text-white/45' : 'bg-white text-[#111] placeholder:text-[#777]',
          )}
        />
      </div>
      <Button
        type="button"
        size="sm"
        className={cn(
          barHeight,
          'shrink-0 rounded-none border-0 bg-[#ef3340] px-3 font-semibold text-white hover:bg-[#d92734] sm:px-5',
        )}
        onClick={() => onQueryChange(query)}
        aria-label="Search"
      >
        <Search className="h-5 w-5" />
        <span className="sr-only">Search</span>
      </Button>
      </div>
    </div>
  );
}

type BrollLibrarySearchShellProps = {
  query: string;
  onQueryChange: (value: string) => void;
  searchKind: 'videos';
  onSearchKindChange: (value: 'videos') => void;
  resultsMeta: ReactNode;
  headerAnchorRef: React.RefObject<HTMLDivElement | null>;
  themeMode: 'light' | 'dark';
};

export function BrollLibraryHeroSearch({
  query,
  onQueryChange,
  searchKind,
  onSearchKindChange,
  // resultsMeta,
  headerAnchorRef,
  themeMode,
}: BrollLibrarySearchShellProps) {
  const heroAnchorRef = useRef<HTMLDivElement>(null);
  const { progress, floatingStyle } = useMorphSearchPosition(heroAnchorRef, headerAnchorRef);
  const compact = progress > 0.55;
  const dockedToNavbar = progress > 0.82;
  const variant: 'hero' | 'header' = dockedToNavbar ? 'header' : 'hero';
  const headingOpacity = Math.max(0, 1 - progress * 1.8);
  // const resultsOpacity = Math.max(0, 1 - progress * 2.2);

  return (
    <>
      <h1
        className="mb-3 text-center font-bold tracking-tight text-white transition-opacity duration-150 sm:mb-4"
        style={{ opacity: headingOpacity }}
      >
        <span className="block text-3xl sm:text-4xl md:text-[2.85rem] md:leading-tight">
          Find The Perfect Clip
        </span>
        <span className="block text-3xl sm:text-4xl md:text-[2.85rem] md:leading-tight">
          For Your Next Masterpiece
        </span>
      </h1>

      <p
        className="mx-auto mb-7 max-w-4xl text-center text-sm font-medium text-white/90 transition-opacity duration-150 sm:mb-8 sm:text-base"
        style={{ opacity: headingOpacity }}
      >
        Access a curated library of high-fidelity stock footage across various niches, ready for
        your creative flow.
      </p>

      {/* In-flow anchor — preserves layout while the bar is fixed */}
      <div ref={heroAnchorRef} className="h-14 w-full" aria-hidden />

      {/* <div
        className="mt-4 flex items-center justify-center gap-3 transition-opacity duration-150"
        style={{ opacity: resultsOpacity }}
      >
        {resultsMeta}
      </div> */}

      <div style={floatingStyle} aria-label="Search videos">
        <BrollSearchBar
          query={query}
          onQueryChange={onQueryChange}
          searchKind={searchKind}
          onSearchKindChange={onSearchKindChange}
          compact={compact}
          variant={variant}
          themeMode={themeMode}
        />
      </div>
    </>
  );
}

export function BrollLibraryHeaderSearchAnchor({
  anchorRef,
}: {
  anchorRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      ref={anchorRef}
      className="mx-auto h-10 w-full min-w-0 max-w-3xl flex-1 px-2"
      aria-hidden
    />
  );
}
