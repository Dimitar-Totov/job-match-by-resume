import { useCallback, useEffect, useMemo, useState } from 'react';
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

/** Below this width the sidebar renders as an overlay drawer instead of a persistent column — must match the `@media` breakpoint in Sidebar.css/AppShell.css. */
const MOBILE_QUERY = '(max-width: 900px)';

function isMobileViewport() {
  return window.matchMedia(MOBILE_QUERY).matches;
}

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
  // Starts collapsed (closed) on mobile so the drawer never auto-opens after login/register;
  // starts expanded on desktop, where the sidebar is a persistent column rather than an overlay.
  const [sidebarCollapsed, setSidebarCollapsed] = useState(isMobileViewport);

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY);
    const handleChange = (event: MediaQueryListEvent) => {
      setSidebarCollapsed(event.matches);
    };
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, []);

  const screen = useMemo<Screen>(() => {
    const match = IN_SHELL_SCREENS.find((candidate) => SCREEN_PATHS[candidate] === location.pathname);
    return match ?? 'dashboard';
  }, [location.pathname]);

  const navigate = useCallback(
    (next: Screen, options?: NavigateOptions) => {
      routerNavigate(SCREEN_PATHS[next], { replace: options?.replace });
      // Selecting a screen from the mobile drawer closes it and reveals the routed content.
      if (isMobileViewport()) {
        setSidebarCollapsed(true);
      }
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
