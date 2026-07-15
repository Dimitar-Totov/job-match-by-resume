import { cn } from '../utils/cn';
import './primitives.css';

type ProgressTone = 'accent' | 'amber' | 'gradient';

interface ProgressBarProps {
  value: number;
  tone?: ProgressTone;
  height?: number;
  label?: string;
  className?: string;
}

const FILLS: Record<ProgressTone, string> = {
  accent: 'linear-gradient(90deg, var(--accent), #5b8bff)',
  amber: 'linear-gradient(90deg, var(--amber), #f0a93a)',
  gradient: 'linear-gradient(90deg, var(--accent), var(--green))',
};

export function ProgressBar({
  value,
  tone = 'accent',
  height = 8,
  label,
  className,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn('progress', className)}
      style={{ height }}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className="progress__fill" style={{ width: `${clamped}%`, background: FILLS[tone] }} />
    </div>
  );
}
