/**
 * URL paths for the router-driven auth flow (welcome/register/login/
 * onboarding/dashboard). Everything past the dashboard shell keeps using
 * NavContext's `screen` state, not the router — see CLAUDE.md.
 */
export const PATHS = {
  welcome: '/',
  register: '/register',
  login: '/login',
  onboarding: '/onboarding',
  dashboard: '/dashboard',
} as const;
