import { createContext } from 'react';
import type { Screen } from '../types';

export interface NavigateOptions {
  /** Replace the current history entry instead of pushing a new one. */
  replace?: boolean;
  /**
   * Arbitrary router state to attach to the navigation, read on the target
   * screen via react-router's `useLocation().state` (typed as `unknown`, so
   * guard it at the read site). Mirrors how the pre-dashboard routes pass data
   * between screens (see RegisterRoute/OnboardingRoute).
   */
  state?: unknown;
}

export interface NavContextValue {
  screen: Screen;
  navigate: (screen: Screen, options?: NavigateOptions) => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

export const NavContext = createContext<NavContextValue | null>(null);
