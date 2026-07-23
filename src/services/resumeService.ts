import type { ParsedResume, ResumeAnalysis, ResumeRecord } from '../types';
import { supabase } from './supabaseClient';

export type ParseStage = 0 | 1 | 2 | 3;

export interface ParseProgress {
  progress: number;
  stage: ParseStage;
}

interface ResumeParseResponse {
  ok: boolean;
  resume?: ParsedResume;
  reason?: string;
}

interface ResumeAnalyzeResponse {
  ok: boolean;
  analysis?: ResumeAnalysis;
  reason?: string;
}

// The parse is really three network steps (upload → invoke → done), but the UI
// shows a smooth progress bar with three stages. We ease progress toward a
// per-stage ceiling on a timer so the bar keeps moving during the long AI step,
// then jump to 100 on completion. `stage` maps to the PARSE_STEPS in UploadScreen
// (0 reading, 1 extracting, 2 structuring, 3 done).
const STAGE_CEILINGS: Record<0 | 1 | 2, number> = { 0: 35, 1: 65, 2: 95 };

/**
 * Upload a resume PDF and parse it into structured data via the `resume-parse`
 * Edge Function. Replaces the former stubbed pipeline; the progress callback +
 * AbortSignal contract is unchanged so callers (useResumeParsing) don't change.
 *
 * Steps: upload the file to the private "resumes" Storage bucket under the user's
 * folder, record a pending row, invoke the function (which downloads, extracts,
 * AI-structures, and persists), and resolve with the parsed resume. Throws on
 * failure — the raw Supabase error for storage/invoke problems, or an Error when
 * the function reports it could not parse the file.
 */
export async function parseResume(
  file: File,
  userId: string,
  onProgress: (p: ParseProgress) => void,
  signal?: AbortSignal,
): Promise<ParsedResume> {
  let progress = 0;
  let ceiling = STAGE_CEILINGS[0];
  let stage: 0 | 1 | 2 = 0;
  let stageTimer = 0;

  const tick = window.setInterval(() => {
    if (signal?.aborted) return;
    // Ease toward the current ceiling without ever reaching it until we advance.
    progress += Math.max(0.4, (ceiling - progress) * 0.12);
    if (progress > ceiling) progress = ceiling;
    onProgress({ progress, stage });
  }, 160);

  const advance = (next: 0 | 1 | 2) => {
    stage = next;
    ceiling = STAGE_CEILINGS[next];
    onProgress({ progress, stage });
  };

  const throwIfAborted = () => {
    if (signal?.aborted) throw new DOMException('Parsing aborted', 'AbortError');
  };

  try {
    throwIfAborted();

    // 1. Upload to Storage under "<uid>/<uuid>.pdf". A fresh uuid per upload
    //    avoids collisions and name-sanitization issues.
    const path = `${userId}/${crypto.randomUUID()}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(path, file, { contentType: file.type || 'application/pdf', upsert: false });

    if (uploadError) throw uploadError;
    throwIfAborted();

    // Record a pending row (carries the original file name for the UI). The
    // function later upserts parsed data onto this same row, preserving file_name.
    const { error: rowError } = await supabase
      .from('resumes')
      .upsert({ user_id: userId, storage_path: path, file_name: file.name, status: 'pending' });

    if (rowError) throw rowError;

    // 2. Extract + structure server-side (the slow part).
    advance(1);
    stageTimer = window.setTimeout(() => advance(2), 900);

    const { data, error } = await supabase.functions.invoke<ResumeParseResponse>('resume-parse', {
      body: { path },
    });

    if (error) throw error;
    if (!data?.ok || !data.resume) {
      throw new Error(data?.reason === 'no_text' ? 'no_text' : 'parse_failed');
    }

    throwIfAborted();

    // 3. Done.
    onProgress({ progress: 100, stage: 3 });
    return data.resume;
  } finally {
    window.clearInterval(tick);
    window.clearTimeout(stageTimer);
  }
}

/**
 * Analyze the user's already-parsed resume via the `resume-analyze` Edge
 * Function (which reads the stored `parsed` data, asks the AI model to score and
 * critique it, and persists the result onto the same row). Resolves with the
 * structured analysis. Throws the raw Supabase error on invoke failure, or an
 * `Error` (`'no_resume'` when the user has no parsed resume yet, `'analyze_failed'`
 * otherwise) when the function reports it could not produce an analysis.
 *
 * The `resume-analyze` function returns the result as HTTP 200, so a handled
 * failure arrives here as `data.ok === false`; genuine errors (401/429) come
 * through the `error` channel. Mirrors `parseResume`'s error contract.
 */
export async function analyzeResume(): Promise<ResumeAnalysis> {
  const { data, error } = await supabase.functions.invoke<ResumeAnalyzeResponse>('resume-analyze');

  if (error) throw error;
  if (!data?.ok || !data.analysis) {
    throw new Error(data?.reason === 'no_resume' ? 'no_resume' : 'analyze_failed');
  }

  return data.analysis;
}

/**
 * Persist edits to the user's parsed resume (from the Review editor) back onto
 * the resume row. Plain owner-scoped update — no AI/secret, so it's a table
 * write, not an Edge Function. The caller passes the full, already-updated
 * `ParsedResume`. Throws the raw Supabase error on failure. Editing can
 * invalidate the stored analysis (its text may no longer match the resume); the
 * Review screen re-analyzes on confirm.
 */
export async function updateParsedResume(userId: string, parsed: ParsedResume): Promise<void> {
  const { error } = await supabase.from('resumes').upsert({ user_id: userId, parsed });

  if (error) throw error;
}

/**
 * Read the current user's stored resume row (raw file location + parsed data +
 * any stored analysis and suggestions), or null if they have not parsed one yet.
 * Throws the raw Supabase error on failure, matching profileService.
 */
export async function getResume(userId: string): Promise<ResumeRecord | null> {
  const { data, error } = await supabase
    .from('resumes')
    .select()
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;

  return data as ResumeRecord | null;
}
