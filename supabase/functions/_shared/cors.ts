// Shared CORS handling for Supabase Edge Functions. The functions gateway is a
// different host than the app, so browser calls via `supabase.functions.invoke`
// need an OPTIONS preflight response plus these headers on every response.
//
// Origin allowlist is defense-in-depth ONLY: CORS is enforced by browsers, so a
// non-browser client (curl, a server, a script) ignores it entirely. It exists
// to stop *other websites* from calling these functions with a victim's cookies,
// not to authenticate callers (that's what the in-function auth check is for).
//
// The allowlist is env-driven so the real production origin(s) can be set at
// deploy time without a code change: set ALLOWED_ORIGINS as a comma-separated
// list via `supabase secrets set ALLOWED_ORIGINS=...`. Falls back to the Vite
// dev server origin for local development.
const DEFAULT_ALLOWED_ORIGINS = ['http://localhost:5173'];

function getAllowedOrigins(): string[] {
  const raw = Deno.env.get('ALLOWED_ORIGINS');
  if (!raw) return DEFAULT_ALLOWED_ORIGINS;

  const parsed = raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return parsed.length > 0 ? parsed : DEFAULT_ALLOWED_ORIGINS;
}

/**
 * CORS headers for a given request. Reflects the request's `Origin` only when it
 * is in the allowlist; otherwise it falls back to the first allowed origin (so
 * disallowed browsers get a mismatched ACAO and the response is blocked).
 */
export function corsHeaders(req: Request): Record<string, string> {
  const allowed = getAllowedOrigins();
  const origin = req.headers.get('Origin');
  const allowOrigin = origin && allowed.includes(origin) ? origin : allowed[0];

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    // Responses depend on the request Origin, so caches must key on it.
    Vary: 'Origin',
  };
}
