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

  return data as BrollCategory[];
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
