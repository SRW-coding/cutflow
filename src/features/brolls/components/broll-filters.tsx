import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/shared/ui/cn';
import {
  BROLL_NATIONALITY_OPTIONS,
  EMPTY_BROLL_FILTERS,
  type BrollFilterValues,
} from '@/features/brolls/components/broll-filter-model';

function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

function sameFilters(a: BrollFilterValues, b: BrollFilterValues): boolean {
  return (
    a.gender === b.gender &&
    a.skin === b.skin &&
    a.minAge === b.minAge &&
    a.maxAge === b.maxAge &&
    a.nationalities.length === b.nationalities.length &&
    a.nationalities.every((value, index) => value === b.nationalities[index])
  );
}

function canScrollElement(element: HTMLElement, deltaY: number): boolean {
  if (element.scrollHeight <= element.clientHeight) return false;
  if (deltaY < 0) return element.scrollTop > 0;
  if (deltaY > 0) {
    return element.scrollTop + element.clientHeight < element.scrollHeight - 1;
  }
  return false;
}

type BrollFiltersProps = {
  value: BrollFilterValues;
  onApply: (value: BrollFilterValues) => void;
  activeCount: number;
  compact: boolean;
  isHero: boolean;
  barHeight: string;
};

export function BrollFilters({
  value,
  onApply,
  activeCount,
  compact,
  isHero,
  barHeight,
}: BrollFiltersProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<BrollFilterValues>(value);
  const [nationalitySearch, setNationalitySearch] = useState('');
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const scrollBodyRef = useRef<HTMLDivElement | null>(null);
  const [panelMaxHeight, setPanelMaxHeight] = useState(520);
  const [panelSide, setPanelSide] = useState<'top' | 'bottom'>('bottom');

  useEffect(() => {
    if (!open) setDraft(value);
  }, [open, value]);

  useLayoutEffect(() => {
    if (!open) return;

    const updatePanelHeight = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;

      const bottomSafety = 96;
      const topSafety = 88;
      const sideOffset = 8;
      const rect = trigger.getBoundingClientRect();
      const availableBelow = window.innerHeight - rect.bottom - bottomSafety - sideOffset;
      const availableAbove = rect.top - topSafety - sideOffset;
      const nextSide = availableBelow < 280 && availableAbove > availableBelow ? 'top' : 'bottom';
      const availableSpace = nextSide === 'top' ? availableAbove : availableBelow;

      setPanelSide(nextSide);
      setPanelMaxHeight(Math.max(160, Math.min(520, availableSpace)));
    };

    updatePanelHeight();
    window.addEventListener('resize', updatePanelHeight);
    return () => {
      window.removeEventListener('resize', updatePanelHeight);
    };
  }, [open]);

  const filteredNationalities = useMemo(() => {
    const query = nationalitySearch.trim().toLowerCase();
    if (!query) return BROLL_NATIONALITY_OPTIONS;
    return BROLL_NATIONALITY_OPTIONS.filter((option) =>
      [option.label, ...option.terms].some((term) => term.toLowerCase().includes(query)),
    );
  }, [nationalitySearch]);

  const minAge = draft.minAge ? Number(draft.minAge) : null;
  const maxAge = draft.maxAge ? Number(draft.maxAge) : null;
  const ageError = minAge !== null && maxAge !== null && minAge > maxAge;

  const setSingleFilter = <K extends 'gender' | 'skin'>(
    key: K,
    selectedValue: BrollFilterValues[K],
  ) => {
    setDraft((current) => ({
      ...current,
      [key]: current[key] === selectedValue ? '' : selectedValue,
    }));
  };

  const toggleNationality = (selectedValue: string) => {
    setDraft((current) => {
      const exists = current.nationalities.includes(selectedValue);
      return {
        ...current,
        nationalities: exists
          ? current.nationalities.filter((value) => value !== selectedValue)
          : [...current.nationalities, selectedValue],
      };
    });
  };

  const handleReset = () => {
    setDraft(EMPTY_BROLL_FILTERS);
    setNationalitySearch('');
    onApply(EMPTY_BROLL_FILTERS);
  };

  const handleApply = () => {
    if (ageError) return;
    onApply(draft);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          type="button"
          size="sm"
          className={cn(
            barHeight,
            'shrink-0 rounded-none border-0 border-l px-2 sm:px-3',
            isHero
              ? 'border-white/10 bg-white/10 text-white hover:bg-white/15'
              : 'border-border text-foreground hover:bg-muted',
          )}
          aria-label={activeCount ? `Filters, ${activeCount} active` : 'Filters'}
          aria-expanded={open}
        >
          <Filter className={cn('h-4 w-4', compact && 'hidden sm:block')} />
          <span>{activeCount ? `Filters (${activeCount})` : 'Filters'}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        avoidCollisions={false}
        side={panelSide}
        sideOffset={8}
        onWheelCapture={(event) => {
          const scrollBody = scrollBodyRef.current;
          if (!scrollBody) return;

          const target = event.target instanceof HTMLElement ? event.target : null;
          const nestedScroller = target?.closest('[data-broll-nested-scroll="true"]');
          if (nestedScroller instanceof HTMLElement) {
            event.stopPropagation();
            if (!canScrollElement(nestedScroller, event.deltaY)) event.preventDefault();
            return;
          }

          event.stopPropagation();

          if (scrollBody.contains(target)) {
            if (!canScrollElement(scrollBody, event.deltaY)) event.preventDefault();
            return;
          }

          if (canScrollElement(scrollBody, event.deltaY)) {
            scrollBody.scrollBy({ top: event.deltaY, behavior: 'auto' });
            return;
          }

          event.preventDefault();
        }}
        className="z-[70] flex max-h-[min(520px,calc(100vh-9rem))] w-[calc(100vw-2rem)] max-w-md flex-col overflow-hidden overscroll-contain rounded-lg border-border bg-card p-0 text-card-foreground shadow-xl"
        style={{ maxHeight: panelMaxHeight }}
      >
        <div className="shrink-0 border-b border-border px-4 py-3">
          <div className="text-sm font-semibold">Filters</div>
          {activeCount > 0 ? (
            <div className="mt-1 text-xs text-muted-foreground">{activeCount} active</div>
          ) : null}
        </div>

        <div
          ref={scrollBodyRef}
          data-broll-scroll-body="true"
          className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-4"
        >
          <FilterSection title="Gender">
            <SegmentedOptions
              value={draft.gender}
              options={[
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
              ]}
              onSelect={(selectedValue) => setSingleFilter('gender', selectedValue)}
            />
          </FilterSection>

          <FilterSection title="Nationality">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={nationalitySearch}
                onChange={(event) => setNationalitySearch(event.target.value)}
                placeholder="Search countries..."
                aria-label="Search nationalities"
                className="h-9 pl-9"
              />
            </div>
            <div
              data-broll-nested-scroll="true"
              className="max-h-52 overflow-y-auto overscroll-contain rounded-md border border-border bg-background/40 p-1"
            >
              {filteredNationalities.length ? (
                filteredNationalities.map((option) => {
                  const checked = draft.nationalities.includes(option.value);
                  return (
                    <label
                      key={option.value}
                      className={cn(
                        'flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors hover:bg-muted',
                        checked && 'bg-primary/10 text-primary hover:bg-primary/15',
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleNationality(option.value)}
                        className="h-4 w-4 rounded border-border accent-primary"
                      />
                      <span className="text-base leading-none" aria-hidden>
                        {option.flag}
                      </span>
                      <span>{option.label}</span>
                    </label>
                  );
                })
              ) : (
                <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                  No countries found.
                </div>
              )}
            </div>
          </FilterSection>

          <FilterSection title="Skin">
            <SegmentedOptions
              value={draft.skin}
              options={[
                { value: 'black', label: 'Black' },
                { value: 'white', label: 'White' },
              ]}
              onSelect={(selectedValue) => setSingleFilter('skin', selectedValue)}
            />
          </FilterSection>

          <FilterSection title="Age">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="broll-filter-min-age" className="text-xs text-muted-foreground">
                  Min age
                </Label>
                <Input
                  id="broll-filter-min-age"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={draft.minAge}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, minAge: onlyDigits(event.target.value) }))
                  }
                  placeholder="Any"
                  aria-invalid={ageError}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="broll-filter-max-age" className="text-xs text-muted-foreground">
                  Max age
                </Label>
                <Input
                  id="broll-filter-max-age"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={draft.maxAge}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, maxAge: onlyDigits(event.target.value) }))
                  }
                  placeholder="Any"
                  aria-invalid={ageError}
                />
              </div>
            </div>
            {ageError ? (
              <div className="text-xs font-medium text-destructive">
                Min age cannot be greater than max age.
              </div>
            ) : null}
          </FilterSection>
        </div>

        <div className="shrink-0 border-t border-border bg-card p-4">
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={handleReset}>
              Reset all
            </Button>
            <Button
              type="button"
              onClick={handleApply}
              disabled={ageError || sameFilters(value, draft)}
            >
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function FilterSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2.5">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </div>
      {children}
    </section>
  );
}

function SegmentedOptions<T extends string>({
  value,
  options,
  onSelect,
}: {
  value: T | '';
  options: Array<{ value: T; label: string }>;
  onSelect: (value: T) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelect(option.value)}
            className={cn(
              'h-9 rounded-md border border-input bg-background px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
              selected && 'border-primary bg-primary/10 text-primary hover:bg-primary/15',
            )}
            aria-pressed={selected}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
