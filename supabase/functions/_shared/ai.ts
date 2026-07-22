// Shared AI-provider setup + JSON helpers for the AI Edge Functions.
//
// This project talks to OpenRouter (https://openrouter.ai) through the OpenAI
// npm SDK, pointed at OpenRouter's OpenAI-compatible endpoint, defaulting to a
// FREE model so calls cost $0. Everything is env-driven so the provider/model
// stay swappable via secrets without a code edit:
//   - OPENROUTER_API_KEY   (required)  the OpenRouter API key (server-side only).
//   - AI_BASE_URL          (optional)  OpenAI-compatible base URL.
//   - AI_MODEL             (optional)  model slug; defaults to a free slug.
//   - AI_REFERER / AI_TITLE (optional) OpenRouter attribution headers
//                                      (HTTP-Referer / X-Title); sent only if set.
import OpenAI from 'npm:openai@6.48.0';

const DEFAULT_BASE_URL = 'https://openrouter.ai/api/v1';
// Must be a currently-available free slug; OpenRouter retires them periodically,
// so prefer overriding via the AI_MODEL secret over relying on this default.
const DEFAULT_MODEL = 'openai/gpt-oss-20b:free';

/** The configured model slug (AI_MODEL secret, or the free default). */
export function getModel(): string {
  return Deno.env.get('AI_MODEL') || DEFAULT_MODEL;
}

/**
 * Build the OpenAI SDK client pointed at OpenRouter from the environment.
 * Throws if OPENROUTER_API_KEY is missing — call it inside the handler's try so
 * the miss becomes a handled { ok: false } result rather than an unhandled crash.
 */
export function createAiClient(): OpenAI {
  const apiKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not set');
  }

  const baseURL = Deno.env.get('AI_BASE_URL') || DEFAULT_BASE_URL;

  // Optional OpenRouter attribution headers — sent only when configured, so we
  // never hardcode a domain. They power OpenRouter's app ranking; safe to omit.
  const defaultHeaders: Record<string, string> = {};
  const referer = Deno.env.get('AI_REFERER');
  const title = Deno.env.get('AI_TITLE');
  if (referer) defaultHeaders['HTTP-Referer'] = referer;
  if (title) defaultHeaders['X-Title'] = title;

  return new OpenAI({ apiKey, baseURL, defaultHeaders });
}

// --- JSON coercion helpers ------------------------------------------------
// Used by the parse/analyze/suggest coercers to defensively normalise model
// output into well-formed shapes regardless of model sloppiness.

export const str = (v: unknown): string => (typeof v === 'string' ? v : '');
export const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
export const obj = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' ? (v as Record<string, unknown>) : {};

/** Strip a ```json ... ``` fence if the model wrapped its output despite the ask. */
export function stripFence(text: string): string {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  return (fence ? fence[1] : text).trim();
}
