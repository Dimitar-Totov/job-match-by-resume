// Deno Edge Function — turn an uploaded resume PDF into structured JSON.
//
// Flow: the client uploads the PDF to the private "resumes" Storage bucket, then
// invokes this function with { path }. We download the file (as the user, so the
// bucket's owner RLS applies), extract its text with unpdf (a serverless build of
// PDF.js), ask the configured AI model to return JSON matching the app's
// ParsedResume shape, and upsert the result into public.resumes. The parsed
// resume is returned to the client and also persisted so any screen can re-read
// it later.
//
// This follows the ai-health TEMPLATE (CLAUDE.md designates it as the pattern for
// any AI/third-party-key function). In order, before spending tokens:
//   1. Authenticate the caller in-function via auth.getUser() (verify_jwt alone
//      is not enough — the anon key is itself a valid JWT).
//   2. Rate-limit per user via check_rate_limit() — this endpoint spends real
//      tokens, so the per-user budget is tighter than ai-health's.
// Provider config is env-driven and identical to ai-health (OPENROUTER_API_KEY,
// AI_BASE_URL, AI_MODEL, AI_REFERER, AI_TITLE) so provider/model stay swappable.
import OpenAI from 'npm:openai@6.48.0';
import { createClient } from 'npm:@supabase/supabase-js@2.110.6';
import { extractText, getDocumentProxy } from 'npm:unpdf@1.6.2';
import { corsHeaders } from '../_shared/cors.ts';

// Per-user budget for this endpoint. Parsing is infrequent but token-billed, so
// keep it tight.
const RATE_LIMIT_ACTION = 'resume-parse';
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW = '1 hour';

// OpenRouter defaults (same as ai-health), overridable via secrets. The model
// must be a currently-available free slug that supports response_format JSON
// mode (see the AI_MODEL secret). Free slugs get retired periodically, so prefer
// overriding via the AI_MODEL secret over relying on this default.
const DEFAULT_BASE_URL = 'https://openrouter.ai/api/v1';
const DEFAULT_MODEL = 'openai/gpt-oss-20b:free';

// Guardrails.
const MAX_FILE_BYTES = 10 * 1024 * 1024; // mirrors the client's 10 MB cap
const MAX_TEXT_CHARS = 20000; // enough for a long resume; caps prompt size/cost

// The structured shape we ask the model to produce — matches ParsedResume in
// src/types/index.ts. Kept in the prompt so the model knows exactly what to emit.
const EXTRACTION_PROMPT = `You are a resume parser. Extract the resume below into JSON with EXACTLY this shape:
{
  "name": string,
  "email": string,
  "phone": string,
  "location": string,
  "education": [{ "school": string, "degree": string, "year": string, "extra": string }],
  "skills": [string],
  "experience": [{ "role": string, "company": string, "dates": string, "bullets": [string] }]
}
Rules:
- Use "" for any string you cannot find and [] for any missing list. Never invent facts.
- "year" is the education date range (e.g. "2019 – 2023"). "extra" is GPA/honors/notes or "".
- "dates" is the job date range (e.g. "Jan 2022 – Present"). "bullets" are the role's responsibility/achievement lines, cleaned up.
- Output ONLY the JSON object, no markdown, no commentary.`;

interface ParsedResume {
  name: string;
  email: string;
  phone: string;
  location: string;
  education: { school: string; degree: string; year: string; extra: string }[];
  skills: string[];
  experience: { role: string; company: string; dates: string; bullets: string[] }[];
}

// Coerce arbitrary parsed JSON into a well-formed ParsedResume so the client
// always gets the exact shape regardless of model sloppiness.
function coerceResume(raw: unknown): ParsedResume {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const str = (v: unknown): string => (typeof v === 'string' ? v : '');
  const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

  return {
    name: str(obj.name),
    email: str(obj.email),
    phone: str(obj.phone),
    location: str(obj.location),
    education: arr(obj.education).map((e) => {
      const o = (e && typeof e === 'object' ? e : {}) as Record<string, unknown>;
      return { school: str(o.school), degree: str(o.degree), year: str(o.year), extra: str(o.extra) };
    }),
    skills: arr(obj.skills).map(str).filter(Boolean),
    experience: arr(obj.experience).map((x) => {
      const o = (x && typeof x === 'object' ? x : {}) as Record<string, unknown>;
      return {
        role: str(o.role),
        company: str(o.company),
        dates: str(o.dates),
        bullets: arr(o.bullets).map(str).filter(Boolean),
      };
    }),
  };
}

// Strip a ```json ... ``` fence if the model wrapped its output despite the ask.
function stripFence(text: string): string {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  return (fence ? fence[1] : text).trim();
}

Deno.serve(async (req: Request) => {
  const cors = corsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors });
  }

  const jsonHeaders = { ...cors, 'Content-Type': 'application/json' };

  // --- 1. Auth ------------------------------------------------------------
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('SUPABASE_URL or SUPABASE_ANON_KEY is not set in the function environment');
    return new Response(JSON.stringify({ ok: false }), { headers: jsonHeaders, status: 500 });
  }

  const authHeader = req.headers.get('Authorization') ?? '';
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      headers: jsonHeaders,
      status: 401,
    });
  }

  const userId = userData.user.id;

  // --- 2. Rate limit ------------------------------------------------------
  const { data: allowed, error: rateError } = await supabase.rpc('check_rate_limit', {
    p_action: RATE_LIMIT_ACTION,
    p_max: RATE_LIMIT_MAX,
    p_window: RATE_LIMIT_WINDOW,
  });

  if (rateError) {
    console.error('Rate limit check failed:', rateError.message);
    return new Response(JSON.stringify({ ok: false }), { headers: jsonHeaders, status: 500 });
  }

  if (!allowed) {
    return new Response(JSON.stringify({ error: 'Too many requests' }), {
      headers: jsonHeaders,
      status: 429,
    });
  }

  // --- 3. Validate input --------------------------------------------------
  let path: string;
  try {
    const body = await req.json();
    path = typeof body?.path === 'string' ? body.path : '';
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      headers: jsonHeaders,
      status: 400,
    });
  }

  // The path must live under the caller's own folder. RLS on storage.objects
  // enforces this too, but reject early rather than attempting a cross-user read.
  if (!path || !path.startsWith(`${userId}/`)) {
    return new Response(JSON.stringify({ error: 'Invalid path' }), {
      headers: jsonHeaders,
      status: 400,
    });
  }

  // --- 4. Download + extract + parse -------------------------------------
  // The result (ok / not ok) is returned as HTTP 200 so the client reads it from
  // `data` (invoke maps non-2xx to the `error` channel with data: null). Auth
  // (401) and rate limit (429) above are genuine errors and stay non-2xx.
  const model = Deno.env.get('AI_MODEL') || DEFAULT_MODEL;

  try {
    const apiKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY is not set');
    }

    // Download the uploaded PDF from Storage (as the user — owner RLS applies).
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('resumes')
      .download(path);

    if (downloadError || !fileData) {
      throw new Error(`Storage download failed: ${downloadError?.message ?? 'no file'}`);
    }

    const bytes = new Uint8Array(await fileData.arrayBuffer());
    if (bytes.byteLength === 0) {
      throw new Error('Downloaded file is empty');
    }
    if (bytes.byteLength > MAX_FILE_BYTES) {
      throw new Error('File exceeds the size limit');
    }

    // Extract text from the PDF.
    const pdf = await getDocumentProxy(bytes);
    const { text } = await extractText(pdf, { mergePages: true });
    const resumeText = (Array.isArray(text) ? text.join('\n') : text).trim();

    if (!resumeText) {
      // A scanned/image-only PDF has no extractable text.
      console.error('Resume parse: no extractable text (image-only PDF?)');
      await supabase
        .from('resumes')
        .upsert({ user_id: userId, storage_path: path, status: 'failed' });
      return new Response(JSON.stringify({ ok: false, reason: 'no_text' }), {
        headers: jsonHeaders,
        status: 200,
      });
    }

    // Ask the model to structure it.
    const baseURL = Deno.env.get('AI_BASE_URL') || DEFAULT_BASE_URL;
    const defaultHeaders: Record<string, string> = {};
    const referer = Deno.env.get('AI_REFERER');
    const title = Deno.env.get('AI_TITLE');
    if (referer) defaultHeaders['HTTP-Referer'] = referer;
    if (title) defaultHeaders['X-Title'] = title;

    const openai = new OpenAI({ apiKey, baseURL, defaultHeaders });

    const completion = await openai.chat.completions.create({
      model,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: EXTRACTION_PROMPT },
        { role: 'user', content: resumeText.slice(0, MAX_TEXT_CHARS) },
      ],
    });

    const content = completion.choices[0]?.message?.content?.trim() ?? '';
    if (!content) {
      throw new Error('Model returned an empty response');
    }

    let parsed: ParsedResume;
    try {
      parsed = coerceResume(JSON.parse(stripFence(content)));
    } catch {
      throw new Error('Model did not return valid JSON');
    }

    // Persist. Upsert so re-parsing replaces the user's single resume row.
    const { error: upsertError } = await supabase.from('resumes').upsert({
      user_id: userId,
      storage_path: path,
      parsed,
      status: 'parsed',
    });

    if (upsertError) {
      // The parse worked; only persistence failed. Log and still return the data.
      console.error('Resume parse: failed to persist:', upsertError.message);
    }

    return new Response(JSON.stringify({ ok: true, resume: parsed }), {
      headers: jsonHeaders,
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Resume parse failed:', message);

    // Best-effort: mark the row failed so the UI can reflect it.
    await supabase
      .from('resumes')
      .upsert({ user_id: userId, storage_path: path, status: 'failed' })
      .then(undefined, () => {});

    return new Response(JSON.stringify({ ok: false }), {
      headers: jsonHeaders,
      status: 200,
    });
  }
});
