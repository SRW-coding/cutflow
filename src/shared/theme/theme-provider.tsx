import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  applyThemeToDocument,
  persistTheme,
  readTheme,
  type CutflowTheme,
} from '@/shared/theme/cutflow-theme';
import { ThemeContext } from '@/shared/theme/theme-context';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<CutflowTheme>(() =>
    readTheme(typeof window !== 'undefined' ? window.location.pathname : undefined),
  );

  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  const setTheme = useCallback((next: CutflowTheme) => {
    setThemeState(next);
    persistTheme(next);
  }, []);

  /** Re-apply stored theme (or route default when nothing saved yet) on navigation */
  const syncRouteTheme = useCallback((pathname: string) => {
    const next = readTheme(pathname);
    setThemeState(next);
    applyThemeToDocument(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const next = current === 'dark' ? 'light' : 'dark';
      persistTheme(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
      isDark: theme === 'dark',
      syncRouteTheme,
    }),
    [theme, setTheme, toggleTheme, syncRouteTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
