import { createContext } from 'react';
import type { Screen } from '../types';

export interface NavContextValue {
  screen: Screen;
  navigate: (screen: Screen) => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

export const NavContext = createContext<NavContextValue | null>(null);
