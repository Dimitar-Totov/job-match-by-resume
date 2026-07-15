import { useCallback, useEffect, useRef, useState } from 'react';
import { parseResume } from '../services/resumeService';
import type { ParseStage } from '../services/resumeService';
import type { ParsedResume } from '../types';

export type ParseStatus = 'idle' | 'parsing' | 'done' | 'error';

export interface UseResumeParsing {
  status: ParseStatus;
  progress: number;
  stage: ParseStage;
  result: ParsedResume | null;
  error: string | null;
  start: () => void;
  reset: () => void;
}

export function useResumeParsing(onComplete?: (resume: ParsedResume) => void): UseResumeParsing {
  const [status, setStatus] = useState<ParseStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<ParseStage>(0);
  const [result, setResult] = useState<ParsedResume | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStatus('idle');
    setProgress(0);
    setStage(0);
    setResult(null);
    setError(null);
  }, []);

  const start = useCallback(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus('parsing');
    setProgress(0);
    setStage(0);
    setError(null);
    setResult(null);

    parseResume(
      ({ progress: p, stage: s }) => {
        setProgress(p);
        setStage(s);
      },
      controller.signal,
    )
      .then((resume) => {
        if (controller.signal.aborted) return;
        setResult(resume);
        setStatus('done');
        onCompleteRef.current?.(resume);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setStatus('error');
        setError('We could not parse that file. Please try again.');
      });
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);

  return { status, progress, stage, result, error, start, reset };
}
