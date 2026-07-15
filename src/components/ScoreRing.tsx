import { useId } from 'react';
import type { ReactNode } from 'react';
import { ringCircumference } from '../utils/score';

interface ScoreRingProps {
  /** 0–100 percentage that fills the ring. */
  percent: number;
  size?: number;
  strokeWidth?: number;
  children: ReactNode;
  /** Accessible description of what the ring represents. */
  label: string;
}

export function ScoreRing({
  percent,
  size = 140,
  strokeWidth = 13,
  children,
  label,
}: ScoreRingProps) {
  const gradientId = useId();
  const radius = size / 2 - strokeWidth;
  const circumference = ringCircumference(radius);
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = circumference * (1 - clamped / 100);
  const center = size / 2;

  return (
    <div style={{ position: 'relative', width: size, height: size, flex: '0 0 auto' }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: 'rotate(-90deg)' }}
        role="img"
        aria-label={label}
      >
        <circle cx={center} cy={center} r={radius} fill="none" stroke="var(--border-2)" strokeWidth={strokeWidth} />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
            ['--ring-c' as string]: `${circumference}`,
            ['--ring-o' as string]: `${offset}`,
            animation: 'ring 1.2s cubic-bezier(.2,.7,.2,1) both',
          }}
        />
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--accent)" />
            <stop offset="1" stopColor="var(--green)" />
          </linearGradient>
        </defs>
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {children}
      </div>
    </div>
  );
}
