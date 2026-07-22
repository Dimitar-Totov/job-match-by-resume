// Shared request-lifecycle preamble for token-billed AI Edge Functions.
//
// Every AI/third-party-key function in this project must, in order and before
// spending any tokens (CLAUDE.md designates ai-health as the template):
//   1. Authenticate the caller in-function via auth.getUser(). `verify_jwt=true`
//      is NOT enough — the public anon key is itself a valid, signed JWT, so it
//      passes signature verification. We must confirm a real user.
//   2. Rate-limit per user via the Postgres check_rate_limit() RPC. Signup is
//      self-serve, so auth alone does not stop a registered user from hammering
//      a token-billed endpoint. (OpenRouter's own free-tier limit is a shared
//      account cap, so the per-user limiter is what keeps one user from
//      exhausting it for everyone.)
//
// `withAiGuards` runs that preamble (plus the CORS preflight and the
// SUPABASE_URL/ANON_KEY env check) once, then hands an authenticated context to
// the function-specific handler. Genuine failures short-circuit non-2xx
// (401 unauth, 429 rate-limited, 500 misconfig) so `supabase.functions.invoke`
// surfaces them via its `error` channel; the handler owns the "handled result"
// contract of returning HTTP 200 with an { ok, ... } body.
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2.110.6';
import { corsHeaders } from './cors.ts';

export interface AiContext {
  /** Supabase client bound to the caller's JWT (owner RLS applies). */
  supabase: SupabaseClient;
  /** The authenticated caller's user id (auth.uid()). */
  userId: string;
  /** CORS + JSON content-type headers to spread onto every handler response. */
  jsonHeaders: Record<string, string>;
  /** The original request, for handlers that read a JSON body. */
  req: Request;
}

export interface RateLimit {
  /** Logical budget key (e.g. "resume-parse"), independent per function. */
  action: string;
  /** Max calls allowed per window. */
  max: number;
  /** Fixed window size as a Postgres interval literal (e.g. "1 hour"). */
  window: string;
}

export async function withAiGuards(
  req: Request,
  rateLimit: RateLimit,
  handler: (ctx: AiContext) => Promise<Response>,
): Promise<Response> {
  const cors = corsHeaders(req);

  // CORS preflight.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors });
  }

  const jsonHeaders = { ...cors, 'Content-Type': 'application/json' };

  // Build a client bound to the caller's JWT. SUPABASE_URL and SUPABASE_ANON_KEY
  // are auto-injected into every function's environment.
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

  // --- 1. Auth ------------------------------------------------------------
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    // Generic body; do not leak why. Non-2xx so invoke maps it to `error`.
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      headers: jsonHeaders,
      status: 401,
    });
  }

  const userId = userData.user.id;

  // --- 2. Rate limit ------------------------------------------------------
  const { data: allowed, error: rateError } = await supabase.rpc('check_rate_limit', {
    p_action: rateLimit.action,
    p_max: rateLimit.max,
    p_window: rateLimit.window,
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

  // Preamble passed — hand off to the function-specific logic.
  return handler({ supabase, userId, jsonHeaders, req });
}
