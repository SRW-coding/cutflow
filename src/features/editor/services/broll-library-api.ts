import type { BrollFilterValues } from '@/features/brolls/components/broll-filter-model';
import { createLogger } from '@/shared/logging/logger';

const logger = createLogger('BrollLibraryApi');

export interface BrollLibraryItem {
  id: number;
  name: string;
  description: string | null;
  url: string;
  thumbnail_url?: string | null;
  type: 'image' | 'video';
  is_premium: boolean;
  gender?: string | null;
  ethnicity?: string | null;
  age?: number | null;
  nationality?: string | null;
}

export interface BrollSubcategory {
  id: number;
  name: string;
  items: BrollLibraryItem[];
}

export interface BrollCategory {
  id: number;
  name: string;
  subcategories: BrollSubcategory[];
}

export class BrollApiError extends Error {
  constructor(
    public readonly code: 'config' | 'network' | 'parse' | 'server',
    message: string
  ) {
    super(message);
    this.name = 'BrollApiError';
  }
}

function getApiRoot(): string {
  const raw = import.meta.env.VITE_CUTFLOW_API_BASE_URL as string | undefined;
  const base = typeof raw === 'string' ? raw.trim() : '';
  if (!base) {
    throw new BrollApiError(
      'config',
      'Set VITE_CUTFLOW_API_BASE_URL in .env to your Cutflow API base (e.g. http://127.0.0.1:8000/api).'
    );
  }
  return base.replace(/\/$/, '');
}

function getBackendOrigin(): string {
  // If API base is `http://localhost:8000/api`, origin should be `http://localhost:8000`.
  // If API base is `http://localhost/cutflow-api/public/api`, origin should be
  // `http://localhost/cutflow-api/public` (where Laravel public assets are served).
  const apiRoot = getApiRoot();
  return apiRoot.endsWith('/api') ? apiRoot.slice(0, -'/api'.length) : apiRoot;
}

function normalizeAssetUrl(assetUrl: string): string {
  if (!assetUrl) return assetUrl;
  if (assetUrl.startsWith('http://') || assetUrl.startsWith('https://')) return assetUrl;

  const origin = getBackendOrigin();
  if (assetUrl.startsWith('/')) return `${origin}${assetUrl}`;
  return `${origin}/${assetUrl}`;
}

// Module-level in-memory cache: survives navigation within the same tab session.
let _libraryCache: BrollCategory[] | null = null;
let _libraryCacheAt = 0;
const LIBRARY_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
// v2: server now ships only the Beauty + Health and Wellness categories. Bumping
// the key ensures users with v1 cached locally don't keep seeing the old set.
const LIBRARY_LS_KEY = 'brolls_library_cache_v2';
const LIBRARY_LS_MAX_AGE_MS = 24 * 60 * 60 * 1000; // serve from disk up to 24h

interface PersistedLibraryCache {
  at: number;
  data: BrollCategory[];
}

function readLocalStorageCache(): PersistedLibraryCache | null {
  try {
    const raw = localStorage.getItem(LIBRARY_LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedLibraryCache;
    if (!parsed || typeof parsed.at !== 'number' || !Array.isArray(parsed.data)) return null;
    if (Date.now() - parsed.at > LIBRARY_LS_MAX_AGE_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeLocalStorageCache(data: BrollCategory[]): void {
  try {
    localStorage.setItem(LIBRARY_LS_KEY, JSON.stringify({ at: Date.now(), data }));
  } catch {
    // Quota / private mode — silently ignore. In-memory cache still applies.
  }
}

/**
 * Synchronous cache lookup for stale-while-revalidate. Returns immediately
 * with whatever the in-memory or localStorage cache holds, even if stale.
 * Callers should still call fetchBrollLibrary() to revalidate in the background.
 */
export function getCachedBrollLibrary(): BrollCategory[] | null {
  if (_libraryCache) return _libraryCache;
  const persisted = readLocalStorageCache();
  if (persisted) {
    _libraryCache = persisted.data;
    _libraryCacheAt = persisted.at;
    return persisted.data;
  }
  return null;
}

function hasServerFilters(filters?: BrollFilterValues): boolean {
  if (!filters) return false;
  // Nationality is NOT sent to the server: the frontend's nationality list uses
  // country slugs (e.g. "united-states", "united-kingdom") that don't match the
  // backend's lowercase codes (e.g. "american", "british"). The fuzzy
  // term-based match in matchesBrollFilters handles nationality client-side.
  return Boolean(filters.gender || filters.ethnicity || filters.minAge || filters.maxAge);
}

function buildLibraryQueryString(filters?: BrollFilterValues): string {
  if (!filters) return '';
  const params = new URLSearchParams();
  if (filters.gender) params.set('gender', filters.gender);
  if (filters.ethnicity) params.set('ethnicity', filters.ethnicity);
  if (filters.minAge) params.set('minAge', filters.minAge);
  if (filters.maxAge) params.set('maxAge', filters.maxAge);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

/**
 * GET /brolls/library — nested categories with subcategories and asset URLs.
 * Pass `filters` to push server-side narrowing for gender/ethnicity/age. The
 * in-memory and localStorage caches only apply to unfiltered fetches.
 * Nationality is filtered client-side because of slug-vs-code mismatch.
 */
export async function fetchBrollLibrary(filters?: BrollFilterValues): Promise<BrollCategory[]> {
  const filtered = hasServerFilters(filters);

  if (!filtered && _libraryCache && Date.now() - _libraryCacheAt < LIBRARY_CACHE_TTL_MS) {
    return _libraryCache;
  }

  const url = `${getApiRoot()}/brolls/library${buildLibraryQueryString(filters)}`;
  let res: Response;
  try {
    res = await fetch(url, { method: 'GET', credentials: 'omit' });
  } catch (e) {
    logger.warn('B-roll library fetch failed', e);
    throw new BrollApiError('network', 'Could not reach the b-roll server. Check the URL and CORS settings.');
  }

  if (!res.ok) {
    throw new BrollApiError(
      'server',
      `Server returned ${res.status} ${res.statusText}`.trim()
    );
  }

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    throw new BrollApiError('parse', 'Invalid JSON from b-roll server.');
  }

  if (
    typeof body !== 'object'
    || body === null
    || !('success' in body)
    || !(body as { success: unknown }).success
    || !('data' in body)
  ) {
    throw new BrollApiError('parse', 'Unexpected response shape from b-roll server.');
  }

  const data = (body as { data: unknown }).data;
  if (!Array.isArray(data)) {
    throw new BrollApiError('parse', 'B-roll library data is not an array.');
  }

  // Normalize possibly-relative asset URLs into absolute URLs for <video src> / fetch()
  const categories = data as BrollCategory[];
  const result = categories.map((cat) => ({
    ...cat,
    subcategories: (cat.subcategories ?? []).map((sub) => ({
      ...sub,
      items: (sub.items ?? []).map((it) => ({
        ...it,
        url: normalizeAssetUrl(it.url),
        thumbnail_url: it.thumbnail_url ? normalizeAssetUrl(it.thumbnail_url) : null,
      })),
    })),
  }));

  if (!filtered) {
    _libraryCache = result;
    _libraryCacheAt = Date.now();
    writeLocalStorageCache(result);
  }
  return result;
}

export function suggestedFileNameForBroll(name: string, assetUrl: string): string {
  const cleaned = [...name]
    .map((c) => {
      const code = c.charCodeAt(0);
      if (code >= 0 && code < 32) return '_';
      if ('<>:"/\\|?*'.includes(c)) return '_';
      return c;
    })
    .join('')
    .trim() || 'b-roll';
  let ext = '.mp4';
  try {
    const u = new URL(assetUrl);
    const last = u.pathname.split('/').pop() ?? '';
    if (last.includes('.')) {
      ext = last.slice(last.lastIndexOf('.'));
    }
  } catch {
    /* keep default */
  }
  const lower = cleaned.toLowerCase();
  if (ext && lower.endsWith(ext.toLowerCase())) {
    return cleaned;
  }
  return `${cleaned}${ext}`;
}
