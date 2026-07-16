import type { JobStatus, ScoreLevel } from '../types';

/** Colour tone for a job/resume score used by score pills. */
export type ScoreTone = 'green' | 'accent' | 'amber';

export function scoreTone(score: number): ScoreTone {
  if (score >= 85) return 'green';
  if (score >= 72) return 'accent';
  return 'amber';
}

export interface StatusMeta {
  label: string;
  tone: ScoreLevel | 'neutral';
}

const STATUS_META: Record<JobStatus, StatusMeta> = {
  saved: { label: 'Saved', tone: 'neutral' },
  applied: { label: 'Applied', tone: 'good' },
  interview: { label: 'Interview', tone: 'warn' },
  offer: { label: 'Offer', tone: 'good' },
  rejected: { label: 'Rejected', tone: 'bad' },
};

export function statusMeta(status: JobStatus): StatusMeta {
  return STATUS_META[status];
}

/** Circumference for an SVG progress ring given a radius. */
export function ringCircumference(radius: number): number {
  return 2 * Math.PI * radius;
}
