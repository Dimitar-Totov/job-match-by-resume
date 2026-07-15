import type { ReactNode } from 'react';
import { cn } from '../utils/cn';
import { Icon } from './Icon';
import './primitives.css';

export type PillTone = 'accent' | 'green' | 'amber' | 'red' | 'neutral';

interface PillTagProps {
  tone?: PillTone;
  icon?: string;
  mono?: boolean;
  children: ReactNode;
}

/** Rounded tag used for skills and keywords. */
export function PillTag({ tone = 'neutral', icon, mono = false, children }: PillTagProps) {
  return (
    <span className={cn('pill', `tone-${tone}`, mono && 'pill--mono')}>
      {icon && <Icon name={icon} size={15} />}
      {children}
    </span>
  );
}
