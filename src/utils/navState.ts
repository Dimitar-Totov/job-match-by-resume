/**
 * Runtime guard for the `{ regenerate: true }` intent passed between screens via
 * react-router's `location.state` (typed as `unknown`). Set by actions that want
 * the destination to force a fresh AI run rather than surface a cached result —
 * e.g. Review's "Confirm & analyze" (→ Analysis). See the `regenerateOnMount`
 * param on `useResumeAnalysis`.
 */
export function wantsRegenerate(state: unknown): boolean {
  return (
    typeof state === 'object' &&
    state !== null &&
    (state as { regenerate?: unknown }).regenerate === true
  );
}
