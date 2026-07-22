import { useCallback, useEffect, useRef, useState } from 'react';
import { generateSuggestions, getResume, saveSuggestions } from '../services/resumeService';
import type { Suggestion, SuggestionState } from '../types';

export type SuggestStatus =
  | 'idle'
  | 'loading' // fetching the stored resume row
  | 'generating' // running the AI generation
  | 'done'
  | 'error'
  | 'empty'; // no parsed resume to suggest against

export interface UseSuggestions {
  status: SuggestStatus;
  suggestions: Suggestion[];
  /** Current overall resume score from the stored analysis, if any (for the score chip). */
  baseScore: number | null;
  error: string | null;
  /** Record a decision on a suggestion (optimistic UI + persisted to the row). */
  setState: (id: number, next: SuggestionState) => void;
  /** Force a fresh AI generation (spends tokens); also serves as the error retry. */
  regenerate: () => void;
}

/**
 * Drives the Suggestions screen: on mount it reads the user's stored resume row
 * and either surfaces cached suggestions (with their persisted accept/reject
 * decisions), kicks off a fresh generation (parsed resume but none generated
 * yet), or reports there's nothing to suggest against. Follows the same
 * explicit-status-enum + request-id staleness guard as `useResumeAnalysis`.
 *
 * `setState` updates the decision optimistically and persists the whole list via
 * `saveSuggestions` (a plain owner update — no AI). A `suggestionsRef` mirror
 * keeps `setState` free of stale-closure reads without re-creating the callback.
 */
export function useSuggestions(userId: string | undefined): UseSuggestions {
  const [status, setStatus] = useState<SuggestStatus>('idle');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [baseScore, setBaseScore] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const suggestionsRef = useRef<Suggestion[]>([]);

  const apply = useCallback((next: Suggestion[]) => {
    suggestionsRef.current = next;
    setSuggestions(next);
  }, []);

  const runGenerate = useCallback(
    (requestId: number) => {
      setStatus('generating');
      setError(null);

      generateSuggestions()
        .then((items) => {
          if (requestIdRef.current !== requestId) return;
          apply(items);
          setStatus('done');
        })
        .catch((err: unknown) => {
          if (requestIdRef.current !== requestId) return;
          if (err instanceof Error && err.message === 'no_resume') {
            setStatus('empty');
            return;
          }
          setStatus('error');
          setError('We could not generate suggestions. Please try again.');
        });
    },
    [apply],
  );

  const load = useCallback(() => {
    if (!userId) {
      requestIdRef.current += 1;
      setStatus('idle');
      apply([]);
      setBaseScore(null);
      setError(null);
      return;
    }

    const requestId = ++requestIdRef.current;
    setStatus('loading');
    setError(null);

    getResume(userId)
      .then((row) => {
        if (requestIdRef.current !== requestId) return;
        // Passively surface the stored analysis score (never triggers analysis).
        setBaseScore(row?.analysis?.overallScore ?? null);

        if (!row || !row.parsed) {
          setStatus('empty');
          return;
        }
        // `ready` means generation ran (even if it produced an empty list), so
        // respect the stored result rather than regenerating every visit.
        if (row.suggestions_status === 'ready') {
          apply(row.suggestions ?? []);
          setStatus('done');
          return;
        }
        // Parsed resume exists but suggestions were never generated — do it now.
        runGenerate(requestId);
      })
      .catch(() => {
        if (requestIdRef.current !== requestId) return;
        setStatus('error');
        setError('We could not load your suggestions. Please try again.');
      });
  }, [userId, apply, runGenerate]);

  const setState = useCallback(
    (id: number, next: SuggestionState) => {
      const updated = suggestionsRef.current.map((s) => (s.id === id ? { ...s, state: next } : s));
      apply(updated);
      if (!userId) return;
      saveSuggestions(userId, updated).catch(() => {
        setError('We could not save your change. Please try again.');
      });
    },
    [userId, apply],
  );

  const regenerate = useCallback(() => {
    if (!userId) return;
    runGenerate(++requestIdRef.current);
  }, [userId, runGenerate]);

  useEffect(() => {
    load();
    return () => {
      requestIdRef.current += 1;
    };
  }, [load]);

  return { status, suggestions, baseScore, error, setState, regenerate };
}
