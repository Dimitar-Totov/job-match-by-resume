import { useCallback, useEffect, useRef, useState } from 'react';
import { parseResume } from '../services/resumeService';
import type { ParseStage } from '../services/resumeService';
import type { ParsedResume } from '../types';
import { useAuth } from './useAuth';

export type ParseStatus = 'idle' | 'parsing' | 'done' | 'error';

export interface UseResumeParsing {
  status: ParseStatus;
  progress: number;
  stage: ParseStage;
  result: ParsedResume | null;
  error: string | null;
  start: (file: File) => void;
  reset: () => void;
}

export function useResumeParsing(onComplete?: (resume: ParsedResume) => void): UseResumeParsing {
  const { user } = useAuth();
  const [status, setStatus] = useState<ParseStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<ParseStage>(0);
  const [result, setResult] = useState<ParsedResume | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const userIdRef = useRef(user?.id);
  userIdRef.current = user?.id;

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStatus('idle');
    setProgress(0);
    setStage(0);
    setResult(null);
    setError(null);
  }, []);

  const start = useCallback((file: File) => {
    const userId = userIdRef.current;
    if (!userId) {
      setStatus('error');
      setError('You need to be signed in to upload a resume.');
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus('parsing');
    setProgress(0);
    setStage(0);
    setError(null);
    setResult(null);

    parseResume(
      file,
      userId,
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
