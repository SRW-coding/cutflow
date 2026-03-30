import { createLogger } from '@/shared/logging/logger';

const logger = createLogger('BrollLibraryApi');

export interface BrollLibraryItem {
  id: number;
  name: string;
  description: string | null;
  url: string;
  type: 'image' | 'video';
  is_premium: boolean;
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

/**
 * GET /brolls/library — nested categories with subcategories and asset URLs.
 */
export async function fetchBrollLibrary(): Promise<BrollCategory[]> {
  const url = `${getApiRoot()}/brolls/library`;
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
  return categories.map((cat) => ({
    ...cat,
    subcategories: (cat.subcategories ?? []).map((sub) => ({
      ...sub,
      items: (sub.items ?? []).map((it) => ({
        ...it,
        url: normalizeAssetUrl(it.url),
      })),
    })),
  }));
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
