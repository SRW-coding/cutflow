export type BrollFilterValues = {
  gender: 'male' | 'female' | '';
  nationalities: string[];
  skin: 'black' | 'white' | '';
  minAge: string;
  maxAge: string;
};

export const EMPTY_BROLL_FILTERS: BrollFilterValues = {
  gender: '',
  nationalities: [],
  skin: '',
  minAge: '',
  maxAge: '',
};

export const BROLL_NATIONALITY_OPTIONS = [
  { value: 'american', label: 'American', flag: '🇺🇸', terms: ['american', 'usa', 'united states'] },
  { value: 'british', label: 'British', flag: '🇬🇧', terms: ['british', 'uk', 'united kingdom'] },
  { value: 'canadian', label: 'Canadian', flag: '🇨🇦', terms: ['canadian', 'canada'] },
  { value: 'australian', label: 'Australian', flag: '🇦🇺', terms: ['australian', 'australia'] },
  { value: 'indian', label: 'Indian', flag: '🇮🇳', terms: ['indian', 'india'] },
  { value: 'pakistani', label: 'Pakistani', flag: '🇵🇰', terms: ['pakistani', 'pakistan'] },
  { value: 'chinese', label: 'Chinese', flag: '🇨🇳', terms: ['chinese', 'china'] },
  { value: 'japanese', label: 'Japanese', flag: '🇯🇵', terms: ['japanese', 'japan'] },
  { value: 'korean', label: 'Korean', flag: '🇰🇷', terms: ['korean', 'south korea'] },
  { value: 'french', label: 'French', flag: '🇫🇷', terms: ['french', 'france'] },
  { value: 'german', label: 'German', flag: '🇩🇪', terms: ['german', 'germany'] },
  { value: 'spanish', label: 'Spanish', flag: '🇪🇸', terms: ['spanish', 'spain'] },
  { value: 'italian', label: 'Italian', flag: '🇮🇹', terms: ['italian', 'italy'] },
  { value: 'brazilian', label: 'Brazilian', flag: '🇧🇷', terms: ['brazilian', 'brazil'] },
  { value: 'mexican', label: 'Mexican', flag: '🇲🇽', terms: ['mexican', 'mexico'] },
  { value: 'nigerian', label: 'Nigerian', flag: '🇳🇬', terms: ['nigerian', 'nigeria'] },
  { value: 'egyptian', label: 'Egyptian', flag: '🇪🇬', terms: ['egyptian', 'egypt'] },
  { value: 'emirati', label: 'Emirati', flag: '🇦🇪', terms: ['emirati', 'uae', 'united arab emirates'] },
  { value: 'turkish', label: 'Turkish', flag: '🇹🇷', terms: ['turkish', 'turkey'] },
  { value: 'saudi', label: 'Saudi', flag: '🇸🇦', terms: ['saudi', 'saudi arabia'] },
];

export function countBrollFilters(filters: BrollFilterValues): number {
  return (
    (filters.gender ? 1 : 0) +
    filters.nationalities.length +
    (filters.skin ? 1 : 0) +
    (filters.minAge || filters.maxAge ? 1 : 0)
  );
}
