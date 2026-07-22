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
// The shared preamble (CORS, in-function auth, per-user rate limiting) and the
// OpenRouter client setup live in _shared/ (see ai-health, the template). This
// function contributes: input validation, download + text extraction, the
// extraction prompt, and coercion/persistence.
import { extractText, getDocumentProxy } from 'npm:unpdf@1.6.2';
import { arr, createAiClient, getModel, obj, str, stripFence } from '../_shared/ai.ts';
import { withAiGuards } from '../_shared/guards.ts';

// Per-user budget for this endpoint. Parsing is infrequent but token-billed, so
// keep it tight.
const RATE_LIMIT = { action: 'resume-parse', max: 10, window: '1 hour' };

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
  const o = obj(raw);

  return {
    name: str(o.name),
    email: str(o.email),
    phone: str(o.phone),
    location: str(o.location),
    education: arr(o.education).map((e) => {
      const eo = obj(e);
      return { school: str(eo.school), degree: str(eo.degree), year: str(eo.year), extra: str(eo.extra) };
    }),
    skills: arr(o.skills).map(str).filter(Boolean),
    experience: arr(o.experience).map((x) => {
      const xo = obj(x);
      return {
        role: str(xo.role),
        company: str(xo.company),
        dates: str(xo.dates),
        bullets: arr(xo.bullets).map(str).filter(Boolean),
      };
    }),
  };
}

Deno.serve((req) =>
  withAiGuards(req, RATE_LIMIT, async ({ supabase, userId, jsonHeaders, req: request }) => {
    // --- Validate input ----------------------------------------------------
    let path: string;
    try {
      const body = await request.json();
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

    // --- Download + extract + parse ---------------------------------------
    // The result (ok / not ok) is returned as HTTP 200 so the client reads it from
    // `data`. A 200-with-ok:false body is how a "handled failure" (e.g. an
    // image-only PDF with no extractable text) reaches the client.
    const model = getModel();

    try {
      const openai = createAiClient();

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
  }),
);
