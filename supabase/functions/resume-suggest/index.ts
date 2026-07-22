// Deno Edge Function — generate AI rewrite suggestions for a parsed resume.
//
// Flow: the client has already parsed a resume (resume-parse persisted the
// structured data on public.resumes.parsed). This function reads that parsed
// JSON for the caller, asks the configured AI model for a list of concrete
// before/after rewrite suggestions (each targeting one existing experience
// bullet), stamps each with an id + a starting 'pending' state, and upserts the
// list onto the same row. The suggestions are returned to the client and
// persisted so the Suggestions screen can re-read them (and the user's later
// accept/reject decisions, written client-side) without re-spending tokens.
//
// The resume text is never modified here — accepting a suggestion only records a
// decision (client-side). The shared preamble (CORS, in-function auth, per-user
// rate limiting) and the OpenRouter client setup live in _shared/ (see
// ai-health, the template). This function contributes: the suggestion prompt,
// coercion, and persistence.
import { arr, createAiClient, getModel, obj, str, stripFence } from '../_shared/ai.ts';
import { withAiGuards } from '../_shared/guards.ts';

// Per-user budget for this endpoint (independent action key => independent
// budget from parse/analyze).
const RATE_LIMIT = { action: 'resume-suggest', max: 10, window: '1 hour' };

// Caps the prompt size/cost. The parsed resume JSON is small, so this is
// generous headroom rather than a real limit.
const MAX_INPUT_CHARS = 20000;
// Never store more than this many suggestions regardless of what the model emits.
const MAX_SUGGESTIONS = 8;

type SuggestionState = 'pending' | 'accepted' | 'rejected';

// The shape we ask the model to produce (before we add id + state). Matches the
// Suggestion type in src/types/index.ts minus the server-assigned fields.
const SUGGEST_PROMPT = `You are an expert resume writer. You are given a candidate's resume as structured JSON. Propose concrete rewrite suggestions that make it stronger. Return JSON with EXACTLY this shape:
{
  "suggestions": [
    { "section": string, "before": string, "after": string, "tags": [string] }
  ]
}
Rules:
- Focus on the experience bullet points (the "bullets" arrays). Each suggestion rewrites ONE existing bullet to be more impactful.
- "before" MUST be the exact current bullet text, copied verbatim from the resume.
- "after" is your improved rewrite: lead with a strong action verb, add specificity, and quantify impact where plausible — but NEVER invent facts, numbers, or achievements the resume does not support.
- "section" is a short display label like "Experience · <company>".
- "tags" are 1-3 very short labels describing the improvement (e.g. "Action verb", "Quantified", "Specific", "Impact").
- Propose between 3 and 6 suggestions, prioritising the weakest bullets. If the resume has fewer than 3 bullets, propose one per bullet.
- Output ONLY the JSON object, no markdown, no commentary.`;

interface Suggestion {
  id: number;
  section: string;
  before: string;
  after: string;
  tags: string[];
  state: SuggestionState;
}

// Coerce arbitrary parsed JSON into a well-formed, id-stamped Suggestion list so
// the client always gets the exact shape regardless of model sloppiness. Drops
// items missing before/after text; caps the total.
function coerceSuggestions(raw: unknown): Suggestion[] {
  const o = obj(raw);
  return arr(o.suggestions)
    .map((s) => {
      const so = obj(s);
      return {
        section: str(so.section),
        before: str(so.before),
        after: str(so.after),
        tags: arr(so.tags).map(str).filter(Boolean).slice(0, 3),
      };
    })
    .filter((s) => s.before && s.after)
    .slice(0, MAX_SUGGESTIONS)
    .map((s, i): Suggestion => ({ id: i + 1, ...s, state: 'pending' }));
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
        // Nothing to suggest against — the user has not parsed a resume yet.
        return new Response(JSON.stringify({ ok: false, reason: 'no_resume' }), {
          headers: jsonHeaders,
          status: 200,
        });
      }

      // Ask the model for suggestions.
      const completion = await openai.chat.completions.create({
        model,
        temperature: 0.4,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SUGGEST_PROMPT },
          { role: 'user', content: JSON.stringify(parsed).slice(0, MAX_INPUT_CHARS) },
        ],
      });

      const content = completion.choices[0]?.message?.content?.trim() ?? '';
      if (!content) {
        throw new Error('Model returned an empty response');
      }

      let suggestions: Suggestion[];
      try {
        suggestions = coerceSuggestions(JSON.parse(stripFence(content)));
      } catch {
        throw new Error('Model did not return valid JSON');
      }

      // Persist onto the existing resume row. Only the suggestions columns are in
      // the payload, so the update leaves parsed/analysis/etc. untouched (the row
      // is guaranteed to exist — we just read its `parsed` above). An empty list is
      // a valid "ready" result (nothing worth suggesting).
      const { error: upsertError } = await supabase.from('resumes').upsert({
        user_id: userId,
        suggestions,
        suggestions_status: 'ready',
      });

      if (upsertError) {
        // Generation worked; only persistence failed. Log and still return them.
        console.error('Resume suggest: failed to persist:', upsertError.message);
      }

      return new Response(JSON.stringify({ ok: true, suggestions }), {
        headers: jsonHeaders,
        status: 200,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Resume suggest failed:', message);

      // Best-effort: mark the row failed so the UI can reflect it.
      await supabase
        .from('resumes')
        .upsert({ user_id: userId, suggestions_status: 'failed' })
        .then(undefined, () => {});

      return new Response(JSON.stringify({ ok: false }), {
        headers: jsonHeaders,
        status: 200,
      });
    }
  }),
);
