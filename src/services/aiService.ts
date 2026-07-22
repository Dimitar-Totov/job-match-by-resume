import { supabase } from './supabaseClient';

/**
 * Unlike the other services in this folder, this one *does* have a real
 * server-side counterpart: `supabase/functions/ai-health/` (a Supabase Edge
 * Function) keeps the OpenRouter API key server-side and is invoked here via
 * `supabase.functions.invoke`. The function reaches the AI provider (OpenRouter,
 * a free Gemini model by default) through the OpenAI SDK server-side. Throws the
 * raw Supabase `FunctionsError` on failure — same throw-the-raw-error convention
 * as the other services.
 *
 * The function returns HTTP 200 with `{ ok, model?, sample? }` for the
 * health-check *result* (readable from `data`) — `model` is the slug that
 * answered and `sample` is its (tiny) reply, both present only when `ok` is
 * true — and real non-2xx statuses — 401 (not signed in) and 429 (rate limited)
 * — which `invoke` surfaces via the `error` channel with `data: null`, so those
 * are thrown here rather than returned.
 */
export interface AiHealthResult {
  ok: boolean;
  model?: string;
  sample?: string;
}

export async function checkAiHealth(): Promise<AiHealthResult> {
  const { data, error } = await supabase.functions.invoke<AiHealthResult>('ai-health');

  if (error) {
    throw error;
  }

  return data as AiHealthResult;
}
