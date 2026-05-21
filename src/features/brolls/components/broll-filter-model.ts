export type BrollNationalityOption = {
  value: string;
  label: string;
  terms: string[];
};

export type BrollFilterValues = {
  gender: 'male' | 'female' | '';
  skin: 'black' | 'white' | '';
  minAge: string;
  maxAge: string;
  nationalities: string[];
};

export const EMPTY_BROLL_FILTERS: BrollFilterValues = {
  gender: '',
  skin: '',
  minAge: '',
  maxAge: '',
  nationalities: [],
};

export const BROLL_GENDER_OPTIONS = [
  { value: 'male' as const, label: 'Male' },
  { value: 'female' as const, label: 'Female' },
];

export const BROLL_SKIN_OPTIONS = [
  { value: 'black' as const, label: 'Black' },
  { value: 'white' as const, label: 'White' },
];

/** Country / region options for nationality matching against item metadata. */
export const BROLL_NATIONALITY_OPTIONS: BrollNationalityOption[] = [
  { value: 'united-states', label: 'United States', terms: ['usa', 'us', 'american', 'america'] },
  { value: 'united-kingdom', label: 'United Kingdom', terms: ['uk', 'british', 'england', 'britain'] },
  { value: 'canada', label: 'Canada', terms: ['canadian'] },
  { value: 'australia', label: 'Australia', terms: ['australian', 'aussie'] },
  { value: 'mexico', label: 'Mexico', terms: ['mexican'] },
  { value: 'brazil', label: 'Brazil', terms: ['brazilian'] },
  { value: 'argentina', label: 'Argentina', terms: ['argentinian', 'argentine'] },
  { value: 'colombia', label: 'Colombia', terms: ['colombian'] },
  { value: 'france', label: 'France', terms: ['french'] },
  { value: 'germany', label: 'Germany', terms: ['german'] },
  { value: 'italy', label: 'Italy', terms: ['italian'] },
  { value: 'spain', label: 'Spain', terms: ['spanish'] },
  { value: 'portugal', label: 'Portugal', terms: ['portuguese'] },
  { value: 'netherlands', label: 'Netherlands', terms: ['dutch', 'holland'] },
  { value: 'belgium', label: 'Belgium', terms: ['belgian'] },
  { value: 'sweden', label: 'Sweden', terms: ['swedish'] },
  { value: 'norway', label: 'Norway', terms: ['norwegian'] },
  { value: 'denmark', label: 'Denmark', terms: ['danish'] },
  { value: 'finland', label: 'Finland', terms: ['finnish'] },
  { value: 'poland', label: 'Poland', terms: ['polish'] },
  { value: 'russia', label: 'Russia', terms: ['russian'] },
  { value: 'ukraine', label: 'Ukraine', terms: ['ukrainian'] },
  { value: 'turkey', label: 'Turkey', terms: ['turkish'] },
  { value: 'india', label: 'India', terms: ['indian'] },
  { value: 'pakistan', label: 'Pakistan', terms: ['pakistani'] },
  { value: 'bangladesh', label: 'Bangladesh', terms: ['bangladeshi'] },
  { value: 'china', label: 'China', terms: ['chinese'] },
  { value: 'japan', label: 'Japan', terms: ['japanese'] },
  { value: 'south-korea', label: 'South Korea', terms: ['korean', 'korea'] },
  { value: 'philippines', label: 'Philippines', terms: ['filipino', 'filipina'] },
  { value: 'vietnam', label: 'Vietnam', terms: ['vietnamese'] },
  { value: 'thailand', label: 'Thailand', terms: ['thai'] },
  { value: 'indonesia', label: 'Indonesia', terms: ['indonesian'] },
  { value: 'malaysia', label: 'Malaysia', terms: ['malaysian'] },
  { value: 'singapore', label: 'Singapore', terms: ['singaporean'] },
  { value: 'saudi-arabia', label: 'Saudi Arabia', terms: ['saudi', 'arabian'] },
  { value: 'uae', label: 'United Arab Emirates', terms: ['emirati', 'emirates', 'dubai'] },
  { value: 'egypt', label: 'Egypt', terms: ['egyptian'] },
  { value: 'nigeria', label: 'Nigeria', terms: ['nigerian'] },
  { value: 'south-africa', label: 'South Africa', terms: ['south african'] },
  { value: 'kenya', label: 'Kenya', terms: ['kenyan'] },
  { value: 'ethiopia', label: 'Ethiopia', terms: ['ethiopian'] },
  { value: 'ghana', label: 'Ghana', terms: ['ghanaian'] },
  { value: 'morocco', label: 'Morocco', terms: ['moroccan'] },
  { value: 'israel', label: 'Israel', terms: ['israeli'] },
  { value: 'greece', label: 'Greece', terms: ['greek'] },
  { value: 'ireland', label: 'Ireland', terms: ['irish'] },
  { value: 'new-zealand', label: 'New Zealand', terms: ['kiwi', 'new zealander'] },
];

function nationalitiesEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const left = [...a].sort();
  const right = [...b].sort();
  return left.every((value, index) => value === right[index]);
}

export function hasActiveBrollFilters(filters: BrollFilterValues): boolean {
  return countBrollFilters(filters) > 0;
}

export function countBrollFilters(filters: BrollFilterValues): number {
  return (
    (filters.gender ? 1 : 0) +
    (filters.skin ? 1 : 0) +
    (filters.minAge || filters.maxAge ? 1 : 0) +
    (filters.nationalities.length > 0 ? 1 : 0)
  );
}

export function sameBrollFilters(a: BrollFilterValues, b: BrollFilterValues): boolean {
  return (
    a.gender === b.gender &&
    a.skin === b.skin &&
    a.minAge === b.minAge &&
    a.maxAge === b.maxAge &&
    nationalitiesEqual(a.nationalities, b.nationalities)
  );
}

type FilterableBrollFields = {
  age?: unknown;
  gender?: unknown;
  nationality?: unknown;
  skin?: unknown;
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
  if (filters.skin && !fieldAsText(item.skin).includes(filters.skin)) return false;

  if (filters.nationalities.length) {
    const nationality = fieldAsText(item.nationality);
    if (!nationality) return false;
    const matchesNationality = filters.nationalities.some((selected) => {
      const option = BROLL_NATIONALITY_OPTIONS.find((candidate) => candidate.value === selected);
      const terms = option ? [option.value, option.label, ...option.terms] : [selected];
      return terms.some((term) => nationality.includes(term.toLowerCase()));
    });
    if (!matchesNationality) return false;
  }

  if (filters.minAge || filters.maxAge) {
    const age = fieldAsAge(item.age);
    if (age === null) return false;
    if (filters.minAge && age < Number(filters.minAge)) return false;
    if (filters.maxAge && age > Number(filters.maxAge)) return false;
  }

  return true;
}
