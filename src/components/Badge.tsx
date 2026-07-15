import type { ReactNode } from 'react';
import { cn } from '../utils/cn';
import { Icon } from './Icon';
import './primitives.css';

export type BadgeTone = 'accent' | 'green' | 'amber' | 'red' | 'neutral';

interface BadgeProps {
  tone?: BadgeTone;
  icon?: string;
  children: ReactNode;
  className?: string;
}

export function Badge({ tone = 'accent', icon, children, className }: BadgeProps) {
  return (
    <span className={cn('badge', `tone-${tone}`, className)}>
      {icon && <Icon name={icon} size={14} />}
      {children}
    </span>
  );
}
