export type BrollEthnicity =
  | 'white'
  | 'black'
  | 'asian'
  | 'spanish'
  | 'swedish'
  | 'italian'
  | 'brazilian'
  | 'ukrainian'
  | 'european'
  | 'british';

export type BrollFilterValues = {
  gender: 'male' | 'female' | '';
  ethnicity: BrollEthnicity | '';
  minAge: string;
  maxAge: string;
};

export const EMPTY_BROLL_FILTERS: BrollFilterValues = {
  gender: '',
  ethnicity: '',
  minAge: '',
  maxAge: '',
};

export const BROLL_GENDER_OPTIONS = [
  { value: 'male' as const, label: 'Male' },
  { value: 'female' as const, label: 'Female' },
];

export const BROLL_ETHNICITY_OPTIONS: Array<{ value: BrollEthnicity; label: string }> = [
  { value: 'white',     label: 'White' },
  { value: 'black',     label: 'Black' },
  { value: 'asian',     label: 'Asian' },
  { value: 'spanish',   label: 'Spanish' },
  { value: 'swedish',   label: 'Swedish' },
  { value: 'italian',   label: 'Italian' },
  { value: 'brazilian', label: 'Brazilian' },
  { value: 'ukrainian', label: 'Ukrainian' },
  { value: 'european',  label: 'European' },
  { value: 'british',   label: 'British' },
];

/** Age range buckets for the age filter dropdown. */
export const BROLL_AGE_RANGE_OPTIONS = [
  { value: '18-24', label: '18-24', min: 18, max: 24 },
  { value: '25-34', label: '25-34', min: 25, max: 34 },
  { value: '35-44', label: '35-44', min: 35, max: 44 },
  { value: '45-54', label: '45-54', min: 45, max: 54 },
  { value: '55-64', label: '55-64', min: 55, max: 64 },
] as const;

export const BROLL_AGE_OPTIONS = BROLL_AGE_RANGE_OPTIONS.map(({ value, label }) => ({
  value,
  label,
}));

export function brollAgeRangeFromBounds(minAge: string, maxAge: string): string {
  if (!minAge || !maxAge) return '';
  const match = BROLL_AGE_RANGE_OPTIONS.find(
    (range) => String(range.min) === minAge && String(range.max) === maxAge,
  );
  return match?.value ?? '';
}

export function brollAgeBoundsFromRange(rangeValue: string): { minAge: string; maxAge: string } {
  const range = BROLL_AGE_RANGE_OPTIONS.find((entry) => entry.value === rangeValue);
  if (!range) return { minAge: '', maxAge: '' };
  return { minAge: String(range.min), maxAge: String(range.max) };
}

export function hasActiveBrollFilters(filters: BrollFilterValues): boolean {
  return countBrollFilters(filters) > 0;
}

export function countBrollFilters(filters: BrollFilterValues): number {
  return (
    (filters.gender ? 1 : 0) +
    (filters.ethnicity ? 1 : 0) +
    (filters.minAge || filters.maxAge ? 1 : 0)
  );
}

export function sameBrollFilters(a: BrollFilterValues, b: BrollFilterValues): boolean {
  return (
    a.gender === b.gender &&
    a.ethnicity === b.ethnicity &&
    a.minAge === b.minAge &&
    a.maxAge === b.maxAge
  );
}

type FilterableBrollFields = {
  age?: unknown;
  gender?: unknown;
  ethnicity?: unknown;
};

function fieldAsText(value: unknown): string {
  if (typeof value === 'string') return value.toLowerCase();
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map(fieldAsText).join(' ');
  return '';
}

function fieldAsAge(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function matchesBrollFilters(item: FilterableBrollFields, filters: BrollFilterValues): boolean {
  if (!hasActiveBrollFilters(filters)) return true;

  if (filters.gender && !fieldAsText(item.gender).includes(filters.gender)) return false;
  if (filters.ethnicity && !fieldAsText(item.ethnicity).includes(filters.ethnicity)) return false;

  if (filters.minAge || filters.maxAge) {
    const age = fieldAsAge(item.age);
    if (age === null) return false;
    if (filters.minAge && age < Number(filters.minAge)) return false;
    if (filters.maxAge && age > Number(filters.maxAge)) return false;
  }

  return true;
}
