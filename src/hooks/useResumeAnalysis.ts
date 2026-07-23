import { useCallback, useEffect, useRef, useState } from 'react';
import { analyzeResume, getResume } from '../services/resumeService';
import type { ResumeAnalysis } from '../types';

export type AnalysisRunStatus =
  | 'idle'
  | 'loading' // fetching the stored resume row
  | 'analyzing' // running the AI analysis
  | 'done'
  | 'error'
  | 'empty'; // no parsed resume to analyze yet

export interface UseResumeAnalysis {
  status: AnalysisRunStatus;
  analysis: ResumeAnalysis | null;
  error: string | null;
  /** Force a fresh AI analysis (spends tokens); also serves as the error retry. */
  reanalyze: () => void;
}

/**
 * Drives the Analysis screen: on mount it reads the user's stored resume row and
 * either surfaces a cached analysis, kicks off a fresh one (parsed resume but no
 * analysis yet), or reports there's nothing to analyze. Follows the same
 * explicit-status-enum + request-id staleness guard as `useResume`/`useProfile`
 * (analysis runs through a plain Edge-Function invoke, so there's no AbortSignal
 * to thread — a bumped request id ignores stale responses instead).
 */
export function useResumeAnalysis(userId: string | undefined): UseResumeAnalysis {
  const [status, setStatus] = useState<AnalysisRunStatus>('idle');
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  // Run the AI analysis (both the auto-run when no cache exists and the explicit
  // re-run). `analyzeResume` reads the parsed resume server-side, so it works even
  // if the client never loaded the row — hence it doubles as the error retry.
  const runAnalysis = useCallback((requestId: number) => {
    setStatus('analyzing');
    setError(null);

    analyzeResume()
      .then((result) => {
        if (requestIdRef.current !== requestId) return;
        setAnalysis(result);
        setStatus('done');
      })
      .catch((err: unknown) => {
        if (requestIdRef.current !== requestId) return;
        if (err instanceof Error && err.message === 'no_resume') {
          setStatus('empty');
          return;
        }
        setStatus('error');
        setError('We could not analyze your resume. Please try again.');
      });
  }, []);

  const load = useCallback(() => {
    if (!userId) {
      requestIdRef.current += 1;
      setStatus('idle');
      setAnalysis(null);
      setError(null);
      return;
    }

    const requestId = ++requestIdRef.current;
    setStatus('loading');
    setError(null);

    getResume(userId)
      .then((row) => {
        if (requestIdRef.current !== requestId) return;
        if (!row || !row.parsed) {
          setStatus('empty');
          return;
        }
        if (row.analysis) {
          setAnalysis(row.analysis);
          setStatus('done');
          return;
        }
        // Parsed resume exists but hasn't been analyzed — generate it now.
        runAnalysis(requestId);
      })
      .catch(() => {
        if (requestIdRef.current !== requestId) return;
        setStatus('error');
        setError('We could not load your resume. Please try again.');
      });
  }, [userId, runAnalysis]);

  const reanalyze = useCallback(() => {
    if (!userId) return;
    runAnalysis(++requestIdRef.current);
  }, [userId, runAnalysis]);

  useEffect(() => {
    load();
    return () => {
      requestIdRef.current += 1;
    };
  }, [load]);

  return { status, analysis, error, reanalyze };
}
