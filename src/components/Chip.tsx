import type { ReactNode } from 'react';
import { cn } from '../utils/cn';
import { Icon } from './Icon';
import './primitives.css';

interface ChipProps {
  selected?: boolean;
  onClick?: () => void;
  children: ReactNode;
}

/** A selectable filter/option chip (used across onboarding and cover tone). */
export function Chip({ selected = false, onClick, children }: ChipProps) {
  return (
    <button
      type="button"
      className={cn('chip', selected && 'chip--selected')}
      aria-pressed={selected}
      onClick={onClick}
    >
      {selected && <Icon name="check" size={18} />}
      {children}
    </button>
  );
}
