import { useCallback, useEffect, useRef, useState } from 'react';
import { getResume } from '../services/resumeService';
import type { ResumeRecord } from '../types';

export type ResumeLoadStatus = 'idle' | 'loading' | 'done' | 'error';

export interface UseResume {
  status: ResumeLoadStatus;
  resume: ResumeRecord | null;
  error: string | null;
  reload: () => void;
}

/**
 * Fetches the given user's stored resume row on mount (and whenever `userId`
 * changes), following the same explicit-status-enum + request-id pattern as
 * `useProfile`. `resume` is null when the user has not parsed one yet.
 */
export function useResume(userId: string | undefined): UseResume {
  const [status, setStatus] = useState<ResumeLoadStatus>('idle');
  const [resume, setResume] = useState<ResumeRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const load = useCallback(() => {
    if (!userId) {
      requestIdRef.current += 1;
      setStatus('idle');
      setResume(null);
      setError(null);
      return;
    }

    const requestId = ++requestIdRef.current;
    setStatus('loading');
    setError(null);

    getResume(userId)
      .then((result) => {
        if (requestIdRef.current !== requestId) return;
        setResume(result);
        setStatus('done');
      })
      .catch(() => {
        if (requestIdRef.current !== requestId) return;
        setStatus('error');
        setError('We could not load your resume. Please try again.');
      });
  }, [userId]);

  useEffect(() => {
    load();
    return () => {
      requestIdRef.current += 1;
    };
  }, [load]);

  return { status, resume, error, reload: load };
}
