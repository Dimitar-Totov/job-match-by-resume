import { useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Screen } from '../types';
import { SCREEN_PATHS } from '../features/app-shell/navConfig';
import { NavContext } from './navContext';
import type { NavContextValue, NavigateOptions } from './navContext';

interface NavProviderProps {
  children: ReactNode;
}

const PRE_DASHBOARD_SCREENS: Screen[] = ['welcome', 'register', 'login', 'onboarding'];
const IN_SHELL_SCREENS = (Object.keys(SCREEN_PATHS) as Screen[]).filter(
  (key) => !PRE_DASHBOARD_SCREENS.includes(key),
);

/**
 * `screen` is derived from the current URL (this provider is only ever
 * mounted inside the auth-guarded subtree, via `DashboardRoute`) rather
 * than tracked as local state, and `navigate()` delegates to react-router's
 * navigation instead of manually mirroring history — the router owns
 * back/forward behavior now.
 */
export function NavProvider({ children }: NavProviderProps) {
  const location = useLocation();
  const routerNavigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const screen = useMemo<Screen>(() => {
    const match = IN_SHELL_SCREENS.find((candidate) => SCREEN_PATHS[candidate] === location.pathname);
    return match ?? 'dashboard';
  }, [location.pathname]);

  const navigate = useCallback(
    (next: Screen, options?: NavigateOptions) => {
      routerNavigate(SCREEN_PATHS[next], { replace: options?.replace });
    },
    [routerNavigate],
  );

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  const value = useMemo<NavContextValue>(
    () => ({ screen, navigate, sidebarCollapsed, toggleSidebar }),
    [screen, navigate, sidebarCollapsed, toggleSidebar],
  );

  return <NavContext value={value}>{children}</NavContext>;
}
