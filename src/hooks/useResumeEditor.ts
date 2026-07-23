import { useCallback, useEffect, useRef, useState } from 'react';
import { getResume, updateParsedResume } from '../services/resumeService';
import type { ParsedResume } from '../types';

export type ResumeEditorStatus =
  | 'idle'
  | 'loading' // fetching the stored resume row
  | 'ready' // parsed resume loaded, editable
  | 'empty' // no parsed resume to edit yet
  | 'error';

/** idle → pending (typed but debounce not elapsed) → saving → saved | error. */
export type ResumeSaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

/** How long after the last edit before an auto-save fires. */
const SAVE_DEBOUNCE_MS = 800;

export interface UseResumeEditor {
  status: ResumeEditorStatus;
  resume: ParsedResume | null;
  saveStatus: ResumeSaveStatus;
  /** Apply an immutable edit and schedule a debounced auto-save. */
  update: (producer: (resume: ParsedResume) => ParsedResume) => void;
  /** Flush any pending edit immediately; resolves true on success (or nothing to save). */
  saveNow: () => Promise<boolean>;
}

/**
 * Drives the Review screen's editor: loads the user's parsed resume, holds it as
 * editable state, and debounce-auto-saves edits back to `resumes.parsed` (a plain
 * owner update — no AI). Follows the same explicit-status-enum + request-id
 * staleness guard as `useResume`, with `saveStatus` for the "changes saved"
 * footer. Pending edits are flushed on unmount so navigating away never drops
 * them, and `saveNow` lets "Confirm & analyze" persist before it re-scores.
 *
 * `update` takes an immutable producer so the caller owns the (nested) shape
 * changes while the hook owns state + persistence. Latest values live in refs so
 * the debounced save and unmount flush always read the freshest resume without
 * re-creating callbacks.
 */
export function useResumeEditor(userId: string | undefined): UseResumeEditor {
  const [status, setStatus] = useState<ResumeEditorStatus>('idle');
  const [resume, setResume] = useState<ParsedResume | null>(null);
  const [saveStatus, setSaveStatus] = useState<ResumeSaveStatus>('idle');

  const requestIdRef = useRef(0);
  const resumeRef = useRef<ParsedResume | null>(null); // latest edited resume
  const dirtyRef = useRef(false); // unsaved edits pending
  const timerRef = useRef<number | undefined>(undefined);
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  const load = useCallback(() => {
    if (!userId) {
      requestIdRef.current += 1;
      setStatus('idle');
      setResume(null);
      resumeRef.current = null;
      dirtyRef.current = false;
      setSaveStatus('idle');
      return;
    }

    const requestId = ++requestIdRef.current;
    setStatus('loading');
    dirtyRef.current = false;
    setSaveStatus('idle');

    getResume(userId)
      .then((row) => {
        if (requestIdRef.current !== requestId) return;
        const parsed = row?.parsed ?? null;
        resumeRef.current = parsed;
        setResume(parsed);
        setStatus(parsed ? 'ready' : 'empty');
      })
      .catch(() => {
        if (requestIdRef.current !== requestId) return;
        setStatus('error');
      });
  }, [userId]);

  // Persist the latest resume if there are unsaved edits. Reads only refs, so it
  // never goes stale and needs no deps.
  const flush = useCallback(async (): Promise<boolean> => {
    if (timerRef.current !== undefined) {
      window.clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
    const uid = userIdRef.current;
    if (!uid || !resumeRef.current || !dirtyRef.current) return true;

    setSaveStatus('saving');
    try {
      await updateParsedResume(uid, resumeRef.current);
      dirtyRef.current = false;
      setSaveStatus('saved');
      return true;
    } catch {
      setSaveStatus('error');
      return false;
    }
  }, []);

  const update = useCallback(
    (producer: (resume: ParsedResume) => ParsedResume) => {
      const current = resumeRef.current;
      if (!current) return;
      const next = producer(current);
      resumeRef.current = next;
      setResume(next);
      dirtyRef.current = true;
      setSaveStatus('pending');

      if (timerRef.current !== undefined) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        void flush();
      }, SAVE_DEBOUNCE_MS);
    },
    [flush],
  );

  const saveNow = useCallback(() => flush(), [flush]);

  useEffect(() => {
    load();
    return () => {
      requestIdRef.current += 1;
      if (timerRef.current !== undefined) window.clearTimeout(timerRef.current);
      // Fire-and-forget any unsaved edits so navigating away never loses them.
      const uid = userIdRef.current;
      if (uid && resumeRef.current && dirtyRef.current) {
        updateParsedResume(uid, resumeRef.current).catch(() => {});
      }
    };
  }, [load]);

  return { status, resume, saveStatus, update, saveNow };
}
