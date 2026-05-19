import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/shared/ui/cn';
import {
  BROLL_NATIONALITY_OPTIONS,
  EMPTY_BROLL_FILTERS,
  type BrollFilterValues,
} from '@/features/brolls/components/broll-filter-model';

const AGE_MIN = 0;
const AGE_MAX = 100;

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

type BrollFiltersPanelProps = {
  value: BrollFilterValues;
  onApply: (value: BrollFilterValues) => void;
  activeCount: number;
  themeMode: 'light' | 'dark';
};

export function BrollFiltersPanel({
  value,
  onApply,
  activeCount,
  themeMode,
}: BrollFiltersPanelProps) {
  const isDark = themeMode === 'dark';
  const [draft, setDraft] = useState<BrollFilterValues>(value);
  const [nationalitySearch, setNationalitySearch] = useState('');

  useEffect(() => {
    setDraft(value);
  }, [value]);

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
  const ageRange: [number, number] = [
    minAge ?? AGE_MIN,
    maxAge ?? AGE_MAX,
  ];

  const selectedNationalities = useMemo(() => {
    const labels = new Map(BROLL_NATIONALITY_OPTIONS.map((option) => [option.value, option]));
    return draft.nationalities
      .map((value) => labels.get(value))
      .filter((option): option is (typeof BROLL_NATIONALITY_OPTIONS)[number] => Boolean(option));
  }, [draft.nationalities]);

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

  const removeNationality = (selectedValue: string) => {
    setDraft((current) => ({
      ...current,
      nationalities: current.nationalities.filter((value) => value !== selectedValue),
    }));
  };

  const setAgeRange = (nextRange: number[]) => {
    const [nextMin = AGE_MIN, nextMax = AGE_MAX] = nextRange;
    setDraft((current) => ({
      ...current,
      minAge: nextMin <= AGE_MIN ? '' : String(nextMin),
      maxAge: nextMax >= AGE_MAX ? '' : String(nextMax),
    }));
  };

  const handleReset = () => {
    setDraft(EMPTY_BROLL_FILTERS);
    setNationalitySearch('');
    onApply(EMPTY_BROLL_FILTERS);
  };

  const handleApply = () => {
    if (ageError) return;
    onApply(draft);
  };

  return (
    <aside
      className={cn(
        'h-fit rounded-lg border p-4 lg:sticky lg:top-24',
        isDark ? 'border-white/10 bg-[#101010] text-white' : 'border-[#e3e3e3] bg-white text-[#111]',
      )}
      aria-label="B-roll filters"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-base font-semibold">Filters</div>
          {activeCount > 0 ? (
            <div className={cn('mt-0.5 text-xs', isDark ? 'text-white/55' : 'text-[#666]')}>
              {activeCount} active
            </div>
          ) : null}
        </div>
        {activeCount > 0 ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className={cn(
              'h-8 px-2 text-xs',
              isDark ? 'text-white/70 hover:bg-white/10 hover:text-white' : 'text-[#555] hover:bg-[#f4f4f4] hover:text-[#111]',
            )}
          >
            Reset
          </Button>
        ) : null}
      </div>

      <div className="space-y-5">
        <FilterSection title="Gender" isDark={isDark}>
          <RadioOptions
            value={draft.gender}
            options={[
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' },
            ]}
            onSelect={(selectedValue) => setSingleFilter('gender', selectedValue)}
            isDark={isDark}
          />
        </FilterSection>

        <FilterSection title="Skin" isDark={isDark}>
          <SegmentedOptions
            value={draft.skin}
            options={[
              { value: 'black', label: 'Black' },
              { value: 'white', label: 'White' },
            ]}
            onSelect={(selectedValue) => setSingleFilter('skin', selectedValue)}
            isDark={isDark}
          />
        </FilterSection>

        <FilterSection title="Age" isDark={isDark}>
          <div
            className={cn(
              'rounded-md border px-3 py-3',
              isDark ? 'border-white/10 bg-[#080808]' : 'border-[#e3e3e3] bg-[#fafafa]',
            )}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className={cn('text-sm font-medium', isDark ? 'text-white' : 'text-[#111]')}>
                {draft.minAge || draft.maxAge
                  ? `${ageRange[0]} - ${ageRange[1]} years`
                  : 'Any age'}
              </span>
              <span className={cn('text-xs', isDark ? 'text-white/45' : 'text-[#777]')}>
                {AGE_MIN}-{AGE_MAX}
              </span>
            </div>
            <Slider
              value={ageRange}
              min={AGE_MIN}
              max={AGE_MAX}
              step={1}
              minStepsBetweenThumbs={1}
              onValueChange={setAgeRange}
              aria-label="Age range"
              className="py-2"
            />
          </div>
          {ageError ? (
            <div className="text-xs font-medium text-destructive">
              Min age cannot be greater than max age.
            </div>
          ) : null}
        </FilterSection>

        <FilterSection title="Tags" isDark={isDark}>
          <div
            className={cn(
              'min-h-10 rounded-md border p-2',
              isDark ? 'border-white/10 bg-[#080808]' : 'border-[#e3e3e3] bg-[#fafafa]',
            )}
          >
            {selectedNationalities.length ? (
              <div className="flex flex-wrap gap-2">
                {selectedNationalities.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => removeNationality(option.value)}
                    className={cn(
                      'inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                      isDark
                        ? 'border-[#ef3340]/35 bg-[#ef3340]/15 text-white hover:bg-[#ef3340]/25'
                        : 'border-[#ffd0d5] bg-[#fff1f2] text-[#bd1f2d] hover:bg-[#ffe5e8]',
                    )}
                  >
                    <span className="truncate">{option.label}</span>
                    <X className="h-3 w-3 shrink-0" />
                  </button>
                ))}
              </div>
            ) : (
              <div className={cn('px-1 py-1 text-xs', isDark ? 'text-white/45' : 'text-[#777]')}>
                Selected nationalities appear here.
              </div>
            )}
          </div>
        </FilterSection>

        <FilterSection title="Nationality" isDark={isDark}>
          <div className="relative">
            <Search
              className={cn(
                'pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2',
                isDark ? 'text-white/45' : 'text-[#707070]',
              )}
            />
            <Input
              value={nationalitySearch}
              onChange={(event) => setNationalitySearch(event.target.value)}
              placeholder="Search countries..."
              aria-label="Search nationalities"
              className={cn(
                'h-9 pl-9',
                isDark
                  ? 'border-white/15 bg-[#080808] text-white placeholder:text-white/35'
                  : 'border-[#d6d6d6] bg-white text-[#111] placeholder:text-[#777]',
              )}
            />
          </div>
          <div
            className={cn(
              'h-64 overflow-y-auto rounded-md border p-1',
              isDark ? 'border-white/15 bg-[#080808]' : 'border-[#d6d6d6] bg-white',
            )}
          >
            {filteredNationalities.length ? (
              filteredNationalities.map((option) => {
                const checked = draft.nationalities.includes(option.value);
                return (
                  <label
                    key={option.value}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors',
                      isDark ? 'hover:bg-white/10' : 'hover:bg-[#f4f4f4]',
                      checked &&
                        (isDark
                          ? 'bg-[#ef3340]/15 text-white hover:bg-[#ef3340]/25'
                          : 'bg-[#fff1f2] text-[#d92734] hover:bg-[#ffe5e8]'),
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleNationality(option.value)}
                      className="h-4 w-4 rounded border-[#d6d6d6] accent-[#ef3340]"
                    />
                    <span className="text-base leading-none" aria-hidden>
                      {option.flag}
                    </span>
                    <span>{option.label}</span>
                  </label>
                );
              })
            ) : (
              <div className={cn('px-2 py-6 text-center text-sm', isDark ? 'text-white/55' : 'text-[#666]')}>
                No countries found.
              </div>
            )}
          </div>
        </FilterSection>
      </div>

      <div className={cn('mt-5 border-t pt-4', isDark ? 'border-white/10' : 'border-[#e3e3e3]')}>
        <Button
          type="button"
          onClick={handleApply}
          disabled={ageError || sameFilters(value, draft)}
          className="w-full bg-[#ef3340] text-white hover:bg-[#d92734]"
        >
          Apply filters
        </Button>
      </div>
    </aside>
  );
}

function FilterSection({
  title,
  isDark,
  children,
}: {
  title: string;
  isDark: boolean;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2.5">
      <div className={cn('text-xs font-semibold uppercase tracking-wide', isDark ? 'text-white/55' : 'text-[#666]')}>
        {title}
      </div>
      {children}
    </section>
  );
}

function RadioOptions<T extends string>({
  value,
  options,
  onSelect,
  isDark,
}: {
  value: T | '';
  options: Array<{ value: T; label: string }>;
  onSelect: (value: T) => void;
  isDark: boolean;
}) {
  return (
    <div className="space-y-1.5" role="radiogroup">
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelect(option.value)}
            className={cn(
              'flex h-9 w-full items-center gap-3 rounded-md px-2.5 text-left text-sm font-medium transition-all duration-200',
              isDark ? 'text-white hover:bg-white/10' : 'text-[#111] hover:bg-[#f4f4f4]',
            )}
            role="radio"
            aria-checked={selected}
          >
            <span
              className={cn(
                'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors duration-200',
                selected
                  ? 'border-[#ef3340]'
                  : isDark
                    ? 'border-white/30'
                    : 'border-[#b8b8b8]',
              )}
              aria-hidden="true"
            >
              <span
                className={cn(
                  'h-2 w-2 rounded-full bg-[#ef3340] transition-transform duration-200',
                  selected ? 'scale-100' : 'scale-0',
                )}
              />
            </span>
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function SegmentedOptions<T extends string>({
  value,
  options,
  onSelect,
  isDark,
}: {
  value: T | '';
  options: Array<{ value: T; label: string }>;
  onSelect: (value: T) => void;
  isDark: boolean;
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
              'h-9 rounded-md border px-3 text-sm font-medium transition-colors',
              isDark
                ? 'border-white/15 bg-[#080808] text-white hover:bg-white/10'
                : 'border-[#d6d6d6] bg-white text-[#111] hover:bg-[#f4f4f4]',
              selected &&
                (isDark
                  ? 'border-[#ef3340] bg-[#ef3340]/15 text-white hover:bg-[#ef3340]/25'
                  : 'border-[#ef3340] bg-[#fff1f2] text-[#d92734] hover:bg-[#ffe5e8]'),
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
