/**
 * URL paths for the top-level, router-driven screens (welcome/register/
 * login/onboarding/dashboard). Every in-shell screen is also router-driven
 * (see `DashboardRoute`), but via the `SCREEN_PATHS` table in
 * `src/features/app-shell/navConfig.ts`, which maps every in-shell `Screen`
 * value to its own flat, top-level path (e.g. `/upload`, `/jobs/match`) — see
 * CLAUDE.md.
 */
export const PATHS = {
  welcome: '/',
  register: '/register',
  login: '/login',
  onboarding: '/onboarding',
  dashboard: '/dashboard',
} as const;
