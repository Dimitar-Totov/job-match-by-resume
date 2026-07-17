import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Screen } from '../types';
import { NavContext } from './navContext';
import type { NavContextValue, NavigateOptions } from './navContext';

interface NavHistoryState {
  screen: Screen;
}

interface NavProviderProps {
  children: ReactNode;
  initialScreen?: Screen;
}

/**
 * Screen changes are mirrored into browser history (pushState/replaceState)
 * so the mouse/keyboard back button walks back through screens the same way
 * an in-app "Back" button does — every in-app Back control calls
 * `window.history.back()` rather than `navigate()` directly, so there's a
 * single source of truth for "what does back do" (this popstate handler).
 */
export function NavProvider({ children, initialScreen = 'welcome' }: NavProviderProps) {
  const [screen, setScreen] = useState<Screen>(initialScreen);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    window.history.replaceState({ screen: initialScreen } satisfies NavHistoryState, '');
    // Seed the initial entry once; initialScreen isn't expected to change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const state = event.state as NavHistoryState | null;
      setScreen(state?.screen ?? initialScreen);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [initialScreen]);

  const navigate = useCallback((next: Screen, options?: NavigateOptions) => {
    if (options?.replace) {
      window.history.replaceState({ screen: next } satisfies NavHistoryState, '');
    } else {
      window.history.pushState({ screen: next } satisfies NavHistoryState, '');
    }
    setScreen(next);
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  const value = useMemo<NavContextValue>(
    () => ({ screen, navigate, sidebarCollapsed, toggleSidebar }),
    [screen, navigate, sidebarCollapsed, toggleSidebar],
  );

  return <NavContext value={value}>{children}</NavContext>;
}
