import { createContext } from 'react';
import type { CutflowTheme } from '@/shared/theme/cutflow-theme';

export type ThemeContextValue = {
  theme: CutflowTheme;
  setTheme: (theme: CutflowTheme) => void;
  toggleTheme: () => void;
  isDark: boolean;
  syncRouteTheme: (pathname: string) => void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);
