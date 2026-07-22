// Deno Edge Function — turn a user's parsed resume into a structured analysis.
//
// Flow: the client has already parsed a resume (resume-parse persisted the
// structured data on public.resumes.parsed). This function reads that parsed
// JSON for the caller, asks the configured AI model for a full analysis
// (overall score, ATS compatibility, section-by-section feedback, writing
// issues, quick wins) matching the app's ResumeAnalysis shape, and upserts it
// onto the same row. The analysis is returned to the client and persisted so
// the Analysis screen can re-read it without re-spending tokens.
//
// The shared preamble (CORS, in-function auth, per-user rate limiting) and the
// OpenRouter client setup live in _shared/ (see ai-health, the template). This
// function contributes: the analysis prompt, coercion, and persistence.
import { arr, createAiClient, getModel, obj, str, stripFence } from '../_shared/ai.ts';
import { withAiGuards } from '../_shared/guards.ts';

// Per-user budget for this endpoint (independent action key => independent
// budget from parse/suggest).
const RATE_LIMIT = { action: 'resume-analyze', max: 10, window: '1 hour' };

// Caps the prompt size/cost. The parsed resume JSON is small, so this is
// generous headroom rather than a real limit.
const MAX_INPUT_CHARS = 20000;

type ScoreLevel = 'good' | 'warn' | 'bad';

// The structured shape we ask the model to produce — matches ResumeAnalysis in
// src/types/index.ts. Kept in the prompt so the model knows exactly what to emit.
const ANALYSIS_PROMPT = `You are an expert resume reviewer and ATS (applicant tracking system) analyst. You are given a candidate's resume as structured JSON. Analyze it and return JSON with EXACTLY this shape:
{
  "overallScore": number,
  "summary": {
    "tone": "good" | "warn" | "bad",
    "label": string,
    "headline": string,
    "body": string
  },
  "ats": {
    "score": number,
    "checks": [{ "label": string, "pass": boolean }]
  },
  "sections": [
    { "name": string, "score": number, "note": string, "level": "good" | "warn" | "bad" }
  ],
  "writingIssues": [
    { "type": string, "severity": "warn" | "bad", "text": string, "fix": string }
  ],
  "quickWins": [
    { "label": string, "gain": string }
  ],
  "projectedScore": number
}
Rules:
- All scores are 0-100. "overallScore" is overall resume quality; "ats.score" is ATS compatibility.
- "summary.tone"/"level": "good" (>=80, strong), "warn" (60-79, needs work), "bad" (<60, missing/poor). "summary.label" is a 2-3 word verdict (e.g. "Strong resume"); "headline" is one short encouraging line; "body" is 1-2 sentences of overall guidance.
- "ats.checks": 5-7 concrete, checkable ATS criteria (e.g. standard section headings, consistent date formatting, machine-readable formatting, contact info present), each pass true/false.
- "sections": one row per standard resume section (Contact info, Professional summary, Work experience, Skills, Education, Certifications). "note" is one short, specific, actionable sentence. If a standard section is absent, still include it with score 0 and level "bad".
- "writingIssues": grammar/wording problems actually present in the resume ([] if none). "type" is a short category ("Grammar", "Weak verb", "Spelling", "Consistency"); "text" quotes or paraphrases the problem; "fix" is the concrete rewrite/correction.
- "quickWins": the 3-5 highest-impact fixes. "gain" is the estimated point increase as a signed string like "+6".
- "projectedScore" is the overallScore if every quick win is applied; it must be >= overallScore and <= 100.
- Base the analysis ONLY on the provided resume. Never invent experience the candidate does not have.
- Output ONLY the JSON object, no markdown, no commentary.`;

interface AtsCheck {
  label: string;
  pass: boolean;
}
interface AnalysisSection {
  name: string;
  score: number;
  note: string;
  level: ScoreLevel;
}
interface WritingIssue {
  type: string;
  severity: 'warn' | 'bad';
  text: string;
  fix: string;
}
interface QuickWin {
  label: string;
  gain: string;
}
interface ResumeAnalysis {
  overallScore: number;
  summary: { tone: ScoreLevel; label: string; headline: string; body: string };
  ats: { score: number; checks: AtsCheck[] };
  sections: AnalysisSection[];
  writingIssues: WritingIssue[];
  quickWins: QuickWin[];
  projectedScore: number;
}

// Clamp any model-provided score into a well-formed 0-100 integer.
const clampScore = (v: unknown): number => {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
};

const asLevel = (v: unknown): ScoreLevel => (v === 'good' || v === 'bad' ? v : 'warn');
const asSeverity = (v: unknown): 'warn' | 'bad' => (v === 'bad' ? 'bad' : 'warn');

// Coerce arbitrary parsed JSON into a well-formed ResumeAnalysis so the client
// always gets the exact shape regardless of model sloppiness.
function coerceAnalysis(raw: unknown): ResumeAnalysis {
  const o = obj(raw);
  const summary = obj(o.summary);
  const ats = obj(o.ats);

  const overallScore = clampScore(o.overallScore);
  // projectedScore must never dip below the current score.
  const projectedScore = Math.max(overallScore, clampScore(o.projectedScore));

  return {
    overallScore,
    summary: {
      tone: asLevel(summary.tone),
      label: str(summary.label),
      headline: str(summary.headline),
      body: str(summary.body),
    },
    ats: {
      score: clampScore(ats.score),
      checks: arr(ats.checks)
        .map((c) => {
          const co = obj(c);
          return { label: str(co.label), pass: co.pass === true };
        })
        .filter((c) => c.label),
    },
    sections: arr(o.sections)
      .map((s) => {
        const so = obj(s);
        return {
          name: str(so.name),
          score: clampScore(so.score),
          note: str(so.note),
          level: asLevel(so.level),
        };
      })
      .filter((s) => s.name),
    writingIssues: arr(o.writingIssues)
      .map((w) => {
        const wo = obj(w);
        return {
          type: str(wo.type),
          severity: asSeverity(wo.severity),
          text: str(wo.text),
          fix: str(wo.fix),
        };
      })
      .filter((w) => w.text),
    quickWins: arr(o.quickWins)
      .map((q) => {
        const qo = obj(q);
        return { label: str(qo.label), gain: str(qo.gain) };
      })
      .filter((q) => q.label),
    projectedScore,
  };
}

Deno.serve((req) =>
  withAiGuards(req, RATE_LIMIT, async ({ supabase, userId, jsonHeaders }) => {
    // The result (ok / not ok) is returned as HTTP 200 so the client reads it from
    // `data`. A handled failure (e.g. the user has no parsed resume yet) is
    // ok:false + 200.
    const model = getModel();

    try {
      const openai = createAiClient();

      // Read the caller's own parsed resume (owner RLS applies).
      const { data: row, error: readError } = await supabase
        .from('resumes')
        .select('parsed')
        .eq('user_id', userId)
        .maybeSingle();

      if (readError) {
        throw new Error(`Failed to read resume: ${readError.message}`);
      }

      const parsed = row?.parsed ?? null;
      if (!parsed || typeof parsed !== 'object') {
        // Nothing to analyze — the user has not parsed a resume yet.
        return new Response(JSON.stringify({ ok: false, reason: 'no_resume' }), {
          headers: jsonHeaders,
          status: 200,
        });
      }

      // Ask the model to analyze it.
      const completion = await openai.chat.completions.create({
        model,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: ANALYSIS_PROMPT },
          { role: 'user', content: JSON.stringify(parsed).slice(0, MAX_INPUT_CHARS) },
        ],
      });

      const content = completion.choices[0]?.message?.content?.trim() ?? '';
      if (!content) {
        throw new Error('Model returned an empty response');
      }

      let analysis: ResumeAnalysis;
      try {
        analysis = coerceAnalysis(JSON.parse(stripFence(content)));
      } catch {
        throw new Error('Model did not return valid JSON');
      }

      // Persist onto the existing resume row. Only the analysis columns are in the
      // payload, so the update leaves parsed/storage_path/etc. untouched (the row
      // is guaranteed to exist — we just read its `parsed` above).
      const { error: upsertError } = await supabase.from('resumes').upsert({
        user_id: userId,
        analysis,
        analysis_status: 'ready',
      });

      if (upsertError) {
        // The analysis worked; only persistence failed. Log and still return it.
        console.error('Resume analyze: failed to persist:', upsertError.message);
      }

      return new Response(JSON.stringify({ ok: true, analysis }), {
        headers: jsonHeaders,
        status: 200,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Resume analyze failed:', message);

      // Best-effort: mark the row failed so the UI can reflect it.
      await supabase
        .from('resumes')
        .upsert({ user_id: userId, analysis_status: 'failed' })
        .then(undefined, () => {});

      return new Response(JSON.stringify({ ok: false }), {
        headers: jsonHeaders,
        status: 200,
      });
    }
  }),
);
