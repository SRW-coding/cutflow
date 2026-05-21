export type CutflowTheme = 'light' | 'dark';

const THEME_KEY = 'cutflow_theme';

export function isBrollsPath(pathname: string): boolean {
  return pathname === '/brolls' || pathname.startsWith('/brolls/');
}

/** Unified theme — first visit defaults: b-roll = light, all other routes = dark */
export function readTheme(pathname?: string): CutflowTheme {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // private mode / quota
  }

  if (pathname && isBrollsPath(pathname)) return 'light';
  return 'dark';
}

export function persistTheme(theme: CutflowTheme): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // ignore
  }
}

export function applyThemeToDocument(theme: CutflowTheme): void {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(theme);
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
}
