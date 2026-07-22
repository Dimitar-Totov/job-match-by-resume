// Deno Edge Function — cheap AI connectivity/auth check via OpenRouter.
//
// This is the TEMPLATE to copy for any AI/third-party-key function (CLAUDE.md
// designates ai-health as the pattern). The shared preamble that every such
// function needs lives in _shared/:
//   - _shared/guards.ts  withAiGuards() — CORS preflight, in-function auth
//                         (getUser), and per-user rate limiting, before any
//                         tokens are spent. See that file for WHY each step.
//   - _shared/ai.ts      createAiClient()/getModel() — the env-driven OpenRouter
//                         client, plus JSON coercion helpers for the parsers.
// So a new function is just: wrap the handler in withAiGuards with its own
// rate-limit budget, do its work, and return the *result* as HTTP 200 so the
// client reads it from `data` (invoke maps non-2xx to the `error` channel with
// data: null). Genuine errors (401 unauth, 429 rate-limited) come from the
// guards and intentionally stay non-2xx.
import { createAiClient, getModel } from '../_shared/ai.ts';
import { withAiGuards } from '../_shared/guards.ts';

// Per-user budget for this endpoint. Tune per function.
const RATE_LIMIT = { action: 'ai-health', max: 10, window: '1 minute' };

Deno.serve((req) =>
  withAiGuards(req, RATE_LIMIT, async ({ jsonHeaders }) => {
    // A minimal real chat completion against the configured FREE model, so this
    // genuinely proves the model responds end-to-end (better than models.list())
    // while still costing nothing.
    const model = getModel();

    try {
      const openai = createAiClient();

      // Keep it cheap: a couple of tokens is enough to prove the model answers.
      const completion = await openai.chat.completions.create({
        model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Reply with the single word: ok' }],
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

      return new Response(JSON.stringify({ ok: false }), { headers: jsonHeaders, status: 200 });
    }
  }),
);
