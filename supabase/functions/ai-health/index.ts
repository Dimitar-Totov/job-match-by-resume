// Deno Edge Function — cheap AI connectivity/auth check via OpenRouter.
//
// This project talks to OpenRouter (https://openrouter.ai) through the OpenAI
// npm SDK, pointed at OpenRouter's OpenAI-compatible endpoint, and uses a FREE
// model (default: google/gemini-2.0-flash-exp:free) so this endpoint costs $0.
// The OPENROUTER_API_KEY secret only ever lives here (set via
// `supabase secrets set`), never in the client bundle. See
// src/services/aiService.ts for the client caller.
//
// Everything is env-driven so the provider/model can be swapped via secrets
// without a code edit:
//   - OPENROUTER_API_KEY  (required)  the OpenRouter API key.
//   - AI_BASE_URL         (optional)  OpenAI-compatible base URL; defaults to
//                                     https://openrouter.ai/api/v1.
//   - AI_MODEL            (optional)  model slug; defaults to a free Gemini.
//   - AI_REFERER / AI_TITLE (optional) OpenRouter attribution headers
//                                     (HTTP-Referer / X-Title); sent only if set.
//
// This is the TEMPLATE to copy for any future AI/third-party-key function
// (CLAUDE.md designates ai-health as the pattern). Every such function must, in
// order and before spending any tokens:
//   1. Authenticate the caller in-function via auth.getUser(). `verify_jwt=true`
//      is NOT enough: the public anon key is itself a valid, signed JWT, so it
//      passes signature verification. We must confirm a real user.
//   2. Rate-limit per user via the Postgres check_rate_limit() RPC — signup is
//      self-serve, so auth alone does not stop a registered user from hammering a
//      token-billed endpoint. (OpenRouter's own free-tier limit — ~20 req/min,
//      50 req/day without purchased credits — is a shared account cap, so the
//      per-user limiter is what keeps one user from exhausting it for everyone.)
import OpenAI from 'npm:openai@6.48.0';
import { createClient } from 'npm:@supabase/supabase-js@2.110.6';
import { corsHeaders } from '../_shared/cors.ts';

// Per-user budget for this endpoint. Tune per function.
const RATE_LIMIT_ACTION = 'ai-health';
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW = '1 minute';

// OpenRouter defaults. Overridable via secrets so the provider/model stays
// swappable without redeploying code.
const DEFAULT_BASE_URL = 'https://openrouter.ai/api/v1';
// Must be a currently-available free slug; OpenRouter retires them periodically,
// so prefer overriding via the AI_MODEL secret over this default.
const DEFAULT_MODEL = 'openai/gpt-oss-20b:free';

Deno.serve(async (req: Request) => {
  const cors = corsHeaders(req);

  // Handle the CORS preflight request.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors });
  }

  const jsonHeaders = { ...cors, 'Content-Type': 'application/json' };

  // --- 1. Auth ------------------------------------------------------------
  // Build a client bound to the caller's JWT and resolve the user. SUPABASE_URL
  // and SUPABASE_ANON_KEY are auto-injected into every function's environment.
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
    // Generic body; do not leak why. Real error status (invoke maps it to `error`).
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      headers: jsonHeaders,
      status: 401,
    });
  }

  // --- 2. Rate limit ------------------------------------------------------
  // Atomic per-user counter keyed by auth.uid() + action + window (Postgres side).
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
    // Real error status so the client surfaces it via the `error` channel.
    return new Response(JSON.stringify({ error: 'Too many requests' }), {
      headers: jsonHeaders,
      status: 429,
    });
  }

  // --- 3. Health check ----------------------------------------------------
  // A minimal real chat completion against the configured FREE model, so this
  // genuinely proves the model responds end-to-end (better than models.list())
  // while still costing nothing. The *result* (ok / not ok) is returned as HTTP
  // 200 so the client reads it from `data`: `supabase.functions.invoke` maps any
  // non-2xx status to the `error` channel with `data: null`, which would hide
  // this body. Auth (401) and rate limit (429) above are genuine errors and
  // intentionally stay non-2xx.
  const model = Deno.env.get('AI_MODEL') || DEFAULT_MODEL;

  try {
    const apiKey = Deno.env.get('OPENROUTER_API_KEY');

    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY is not set');
    }

    const baseURL = Deno.env.get('AI_BASE_URL') || DEFAULT_BASE_URL;

    // Optional OpenRouter attribution headers — sent only when configured, so we
    // never hardcode a domain. HTTP-Referer / X-Title power OpenRouter's app
    // ranking; they are safe to omit.
    const defaultHeaders: Record<string, string> = {};
    const referer = Deno.env.get('AI_REFERER');
    const title = Deno.env.get('AI_TITLE');
    if (referer) defaultHeaders['HTTP-Referer'] = referer;
    if (title) defaultHeaders['X-Title'] = title;

    const openai = new OpenAI({ apiKey, baseURL, defaultHeaders });

    // Keep it cheap: a couple of tokens is enough to prove the model answers.
    const completion = await openai.chat.completions.create({
      model,
      max_tokens: 10,
      messages: [
        { role: 'user', content: 'Reply with the single word: ok' },
      ],
    });

    const sample = completion.choices[0]?.message?.content?.trim() ?? '';

    if (!sample) {
      // Call succeeded but the model returned nothing usable — treat as not ok.
      console.error('AI health check: model returned an empty response');
      return new Response(JSON.stringify({ ok: false }), { headers: jsonHeaders, status: 200 });
    }

    return new Response(JSON.stringify({ ok: true, model, sample }), {
      headers: jsonHeaders,
      status: 200,
    });
  } catch (error) {
    // Log the real detail server-side; never echo raw upstream errors to the client.
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('AI health check failed:', message);

    return new Response(JSON.stringify({ ok: false }), {
      headers: jsonHeaders,
      status: 200,
    });
  }
});
