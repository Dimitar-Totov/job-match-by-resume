import { useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Screen } from '../types';
import { NavContext } from './navContext';
import type { NavContextValue } from './navContext';

interface NavProviderProps {
  children: ReactNode;
  initialScreen?: Screen;
}

export function NavProvider({ children, initialScreen = 'welcome' }: NavProviderProps) {
  const [screen, setScreen] = useState<Screen>(initialScreen);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const navigate = useCallback((next: Screen) => {
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
