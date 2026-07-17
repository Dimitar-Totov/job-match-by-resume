import { createContext } from 'react';
import type { Screen } from '../types';

export interface NavigateOptions {
  /** Replace the current history entry instead of pushing a new one. */
  replace?: boolean;
}

export interface NavContextValue {
  screen: Screen;
  navigate: (screen: Screen, options?: NavigateOptions) => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

export const NavContext = createContext<NavContextValue | null>(null);
