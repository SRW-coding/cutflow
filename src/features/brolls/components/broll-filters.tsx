import { useEffect, useState, type ReactNode } from 'react';
import {
  Calendar,
  ChevronDown,
  Filter,
  Globe,
  RotateCcw,
  User,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/shared/ui/cn';
import {
  BROLL_GENDER_OPTIONS,
  BROLL_ETHNICITY_OPTIONS,
  countBrollFilters,
  EMPTY_BROLL_FILTERS,
  sameBrollFilters,
  type BrollFilterValues,
} from '@/features/brolls/components/broll-filter-model';
import { BrollNationalitySelect2 } from '@/features/brolls/components/broll-nationality-select2';

const AGE_MIN = 0;
const AGE_MAX = 100;
const ANY_VALUE = '__any__';
const BROLL_GRADIENT = 'from-[#fb0302] via-[#fd8b0c] to-[#fee51b]';
const FILTER_FIELD_H = 'h-9';
const filterSelectItemClass = (isDark: boolean) =>
  cn(
    'broll-filter-select-item rounded-md py-1.5 pl-2.5 pr-7 text-[13px]',
    isDark
      ? 'text-white/75 focus:bg-white/10 focus:text-[#fd8b0c] focus:font-semibold data-[state=checked]:bg-white/10 data-[state=checked]:font-semibold data-[state=checked]:text-[#fd8b0c]'
      : 'text-slate-600 focus:bg-[#fff5f0] focus:text-[#fd8b0c] focus:font-semibold data-[state=checked]:bg-[#fff5f0] data-[state=checked]:font-semibold data-[state=checked]:text-[#fd8b0c]',
  );
export const GRADIENT_BTN =
  'broll-gradient-btn text-white shadow-[0_12px_26px_rgba(0,0,0,0.22)] transition-[filter] hover:brightness-95 active:brightness-90';

type BrollFiltersToggleProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeCount: number;
  themeMode: 'light' | 'dark';
};

export function BrollFiltersToggle({
  open,
  onOpenChange,
  activeCount,
  themeMode,
}: BrollFiltersToggleProps) {
  const isDark = themeMode === 'dark';

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={() => onOpenChange(!open)}
      aria-expanded={open}
      className={cn(
        'broll-filters-toggle relative h-10 shrink-0 gap-2 rounded-full border px-5 text-xs font-bold uppercase tracking-wider shadow-none',
        activeCount > 0 && 'pr-7',
        isDark
          ? 'border-[#fd8b0c]/70 bg-[#1a1208] text-[#fd8b0c] hover:!bg-[#261a0c] hover:!text-[#fd8b0c] focus-visible:ring-[#fd8b0c]/40'
          : 'border-[#fd8b0c] bg-[#fff5f0] text-[#fd8b0c] hover:!bg-[#ffe8dc] hover:!text-[#fd8b0c] focus-visible:ring-[#fd8b0c]/30',
      )}
    >
      <Filter className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden />
      <span>Filters</span>
      {activeCount > 0 ? (
        <span
          className={cn(
            'broll-filters-toggle__badge absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none text-white',
            'bg-gradient-to-r',
            BROLL_GRADIENT,
          )}
          aria-label={`${activeCount} active filters`}
        >
          {activeCount}
        </span>
      ) : null}
      <ChevronDown
        className={cn(
          'h-4 w-4 shrink-0 opacity-80 transition-transform duration-300',
          open && 'rotate-180',
        )}
        aria-hidden
      />
    </Button>
  );
}

type BrollFiltersPanelProps = {
  open: boolean;
  value: BrollFilterValues;
  onApply: (value: BrollFilterValues) => void;
  activeCount: number;
  themeMode: 'light' | 'dark';
};

export function BrollFiltersPanel({
  open,
  value,
  onApply,
  activeCount,
  themeMode,
}: BrollFiltersPanelProps) {
  const isDark = themeMode === 'dark';
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const minAge = draft.minAge ? Number(draft.minAge) : null;
  const maxAge = draft.maxAge ? Number(draft.maxAge) : null;
  const ageError = minAge !== null && maxAge !== null && minAge > maxAge;
  const ageRange: [number, number] = [minAge ?? AGE_MIN, maxAge ?? AGE_MAX];

  const draftActiveCount = countBrollFilters(draft);
  const draftHasFilters = draftActiveCount > 0;

  const setAgeRange = ([nextMin, nextMax]: number[]) => {
    setDraft((current) => ({
      ...current,
      minAge: nextMin <= AGE_MIN ? '' : String(nextMin),
      maxAge: nextMax >= AGE_MAX ? '' : String(nextMax),
    }));
  };

  const handleResetAll = () => {
    setDraft(EMPTY_BROLL_FILTERS);
  };

  const handleApply = () => {
    if (ageError) return;
    onApply(draft);
  };

  return (
    <div
      className={cn(
        'broll-filters-collapse grid w-full min-w-0 transition-[grid-template-rows] duration-300 ease-in-out motion-reduce:transition-none',
        open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
      )}
      aria-hidden={!open}
    >
      <div className="min-h-0 overflow-hidden">
        <div
          className={cn(
            'mt-3 w-full overflow-hidden rounded-lg border',
            panelBorder(isDark),
            isDark ? 'bg-[#101010] text-white' : 'bg-white text-[#111]',
          )}
          aria-label="B-roll filters"
        >
          <div className="grid grid-cols-1 gap-5 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <FilterColumn
              label="Age bounds"
              icon={Calendar}
              isDark={isDark}
              valueLabel={
                draft.minAge || draft.maxAge
                  ? `${ageRange[0]} – ${ageRange[1]} years old`
                  : undefined
              }
            >
              <div className={cn('flex w-full items-center', FILTER_FIELD_H)}>
                <Slider
                  value={ageRange}
                  min={AGE_MIN}
                  max={AGE_MAX}
                  step={1}
                  minStepsBetweenThumbs={1}
                  onValueChange={setAgeRange}
                  aria-label="Age range"
                  className="broll-age-slider w-full"
                />
              </div>
              {ageError ? (
                <p className="mt-1.5 text-xs font-medium text-destructive">
                  Min age cannot be greater than max age.
                </p>
              ) : null}
            </FilterColumn>

            <BrollFilterDropdown
              label="Ethnicity"
              icon={User}
              value={draft.ethnicity}
              placeholder="Any"
              options={BROLL_ETHNICITY_OPTIONS}
              onChange={(ethnicity) => setDraft((c) => ({ ...c, ethnicity: ethnicity as BrollFilterValues['ethnicity'] }))}
              isDark={isDark}
            />

            <FilterColumn label="Nationality" isDark={isDark}>
              <GradientBorder isDark={isDark}>
                <div
                  className={cn(
                    'flex w-full items-center gap-2 px-2.5',
                    FILTER_FIELD_H,
                    isDark ? 'bg-[#0c0c0c] text-white' : 'bg-white text-[#111]',
                    draft.nationalities.length > 0 && 'text-[#fb0302]',
                  )}
                >
                  <Globe
                    className={cn(
                      'h-3.5 w-3.5 shrink-0',
                      draft.nationalities.length > 0 ? 'text-[#fb0302] opacity-100' : 'opacity-70',
                    )}
                    aria-hidden
                  />
                  <BrollNationalitySelect2
                    value={draft.nationalities}
                    onChange={(nationalities) => setDraft((c) => ({ ...c, nationalities }))}
                    isDark={isDark}
                    className="broll-nationality-select2--inline min-w-0 flex-1"
                    hasSelection={draft.nationalities.length > 0}
                  />
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50 pointer-events-none" aria-hidden />
                </div>
              </GradientBorder>
            </FilterColumn>

            <BrollFilterDropdown
              label="Gender"
              icon={Users}
              value={draft.gender}
              placeholder="Any"
              options={BROLL_GENDER_OPTIONS}
              onChange={(gender) =>
                setDraft((c) => ({ ...c, gender: gender as BrollFilterValues['gender'] }))
              }
              isDark={isDark}
            />
          </div>

          <footer
            className={cn(
              'flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3',
              panelBorder(isDark),
            )}
          >
            <div className="min-w-0 flex-1">
              {activeCount > 0 ? (
                <p className={cn('text-xs sm:text-sm', mutedText(isDark))}>
                  Showing{' '}
                  <strong className={isDark ? 'text-white' : 'text-[#111]'}>{activeCount}</strong>{' '}
                  active video parameter{activeCount === 1 ? '' : 's'} matched
                </p>
              ) : draftHasFilters ? (
                <p className={cn('text-xs sm:text-sm', mutedText(isDark))}>
                  <strong className={isDark ? 'text-white' : 'text-[#111]'}>{draftActiveCount}</strong>{' '}
                  filter{draftActiveCount === 1 ? '' : 's'} selected — apply to update results
                </p>
              ) : (
                <p className={cn('text-xs sm:text-sm', mutedText(isDark))}>No filters selected</p>
              )}
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {draftHasFilters ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResetAll}
                  className={cn(
                    'h-9 gap-2 px-3 text-xs font-semibold uppercase tracking-wide',
                    isDark
                      ? 'bg-white/10 text-[#fb0302] hover:bg-white/15 hover:text-[#fb0302]'
                      : 'bg-[#fff0eb] text-[#fb0302] hover:bg-[#ffe8dc] hover:text-[#fb0302]',
                  )}
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                  Reset filters
                </Button>
              ) : null}
              <Button
                type="button"
                onClick={handleApply}
                disabled={ageError || sameBrollFilters(value, draft)}
                className={cn('h-9 px-6', GRADIENT_BTN)}
              >
                Apply filters
              </Button>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

function panelBorder(isDark: boolean) {
  return isDark ? 'border-white/10' : 'border-[#e3e3e3]';
}

function mutedText(isDark: boolean) {
  return isDark ? 'text-white/55' : 'text-[#666]';
}

function GradientBorder({ isDark, children }: { isDark: boolean; children: ReactNode }) {
  return (
    <div className="broll-gradient-border rounded-md p-px">
      <div
        className={cn(
          'overflow-hidden rounded-[5px]',
          isDark ? 'bg-[#0c0c0c]' : 'bg-white',
        )}
      >
        {children}
      </div>
    </div>
  );
}

function FilterColumn({
  label,
  icon: Icon,
  isDark,
  valueLabel,
  children,
}: {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  isDark: boolean;
  valueLabel?: string;
  children: ReactNode;
}) {
  return (
    <section className="flex min-w-0 flex-col">
      <div className="mb-2.5 flex flex-wrap items-center gap-x-2 gap-y-1">
        {Icon ? (
          <Icon
            className={cn('h-3.5 w-3.5 shrink-0', isDark ? 'text-white/50' : 'text-[#888]')}
            aria-hidden
          />
        ) : null}
        <h3 className={cn('text-[10px] font-semibold uppercase tracking-widest', mutedText(isDark))}>
          {label}
        </h3>
        {valueLabel ? (
          <span className="text-xs font-semibold text-[#fb0302] sm:ml-auto">{valueLabel}</span>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function BrollFilterDropdown<T extends string>({
  label,
  icon: Icon,
  value,
  placeholder,
  options,
  onChange,
  isDark,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  value: T | '';
  placeholder: string;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T | '') => void;
  isDark: boolean;
}) {
  const selected = Boolean(value);

  return (
    <FilterColumn label={label} icon={Icon} isDark={isDark}>
      <GradientBorder isDark={isDark}>
        <Select
          value={value || ANY_VALUE}
          onValueChange={(next) => onChange(next === ANY_VALUE ? '' : (next as T))}
        >
          <SelectTrigger
            className={cn(
              'w-full gap-2 border-0 text-[13px] shadow-none focus:ring-0 focus:ring-offset-0',
              FILTER_FIELD_H,
              isDark
                ? 'bg-[#0c0c0c] text-white hover:bg-[#141414]'
                : 'bg-white text-[#111] hover:bg-[#fafafa]',
              selected && 'text-[#fb0302] [&>span]:text-[#fb0302]',
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent
            className={cn(
              'broll-filter-select-content min-w-[var(--radix-select-trigger-width)] p-1',
              isDark
                ? 'border-white/15 bg-[#151515] text-white'
                : 'border-[#e5e5e5] bg-white text-[#111] shadow-md',
            )}
          >
            <SelectItem value={ANY_VALUE} className={filterSelectItemClass(isDark)}>
              {placeholder}
            </SelectItem>
            {options.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                className={filterSelectItemClass(isDark)}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </GradientBorder>
    </FilterColumn>
  );
}
