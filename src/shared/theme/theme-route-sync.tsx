import { useEffect } from 'react';
import { useRouterState } from '@tanstack/react-router';
import { useTheme } from '@/shared/theme/theme-provider';

/** Keeps document theme in sync when navigating (unified storage; route default only if unset). */
export function ThemeRouteSync() {
  const { syncRouteTheme } = useTheme();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  useEffect(() => {
    syncRouteTheme(pathname);
  }, [pathname, syncRouteTheme]);

  return null;
}
