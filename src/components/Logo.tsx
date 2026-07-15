import { cn } from '../utils/cn';
import { Icon } from './Icon';
import './Logo.css';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  /** Hide the wordmark, showing only the badge (collapsed sidebar). */
  markOnly?: boolean;
}

export function Logo({ size = 'md', markOnly = false }: LogoProps) {
  const iconSize = size === 'lg' ? 23 : size === 'sm' ? 20 : 21;
  return (
    <div className={cn('logo', `logo--${size}`)}>
      <span className="logo__badge">
        <Icon name="workspace_premium" size={iconSize} color="#fff" />
      </span>
      {!markOnly && <span className="logo__word">Job&nbsp;Matcher</span>}
    </div>
  );
}
