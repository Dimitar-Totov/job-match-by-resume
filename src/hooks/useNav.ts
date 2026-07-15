import { useContext } from 'react';
import { NavContext } from '../context/navContext';
import type { NavContextValue } from '../context/navContext';

export function useNav(): NavContextValue {
  const ctx = useContext(NavContext);
  if (!ctx) {
    throw new Error('useNav must be used within a NavProvider');
  }
  return ctx;
}
