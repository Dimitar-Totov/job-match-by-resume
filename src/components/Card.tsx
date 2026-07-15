import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../utils/cn';
import './Card.css';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: 'sm' | 'md' | 'lg';
  elevation?: 'sm' | 'md';
}

export function Card({
  children,
  padding = 'md',
  elevation = 'md',
  className,
  ...rest
}: CardProps) {
  return (
    <div className={cn('card', `card--p-${padding}`, `card--e-${elevation}`, className)} {...rest}>
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: ReactNode;
  action?: ReactNode;
}

export function CardHeader({ title, action }: CardHeaderProps) {
  return (
    <div className="card__header">
      <div className="card__title">{title}</div>
      {action}
    </div>
  );
}
