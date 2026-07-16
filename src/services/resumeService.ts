import type { ParsedResume } from '../types';
import { parsedResume } from './mockData';

export type ParseStage = 0 | 1 | 2 | 3;

export interface ParseProgress {
  progress: number;
  stage: ParseStage;
}

/**
 * Stubbed resume parsing. No real backend exists yet — this simulates an
 * async upload/parse pipeline with progress updates. Replace the body with a
 * real API call (POST /resume/parse) once the endpoint is defined; the public
 * signature intentionally mirrors a streaming upload so callers do not change.
 */
export function parseResume(
  onProgress: (p: ParseProgress) => void,
  signal?: AbortSignal,
): Promise<ParsedResume> {
  return new Promise((resolve, reject) => {
    let progress = 0;

    const stageFor = (p: number): ParseStage => (p < 30 ? 0 : p < 62 ? 1 : 2);

    const interval = window.setInterval(() => {
      if (signal?.aborted) {
        window.clearInterval(interval);
        reject(new DOMException('Parsing aborted', 'AbortError'));
        return;
      }

      progress += 3 + Math.random() * 6;

      if (progress >= 100) {
        window.clearInterval(interval);
        onProgress({ progress: 100, stage: 3 });
        window.setTimeout(() => resolve(parsedResume), 650);
        return;
      }

      onProgress({ progress, stage: stageFor(progress) });
    }, 170);

    signal?.addEventListener('abort', () => {
      window.clearInterval(interval);
      reject(new DOMException('Parsing aborted', 'AbortError'));
    });
  });
}
