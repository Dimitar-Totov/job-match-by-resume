# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start the Vite dev server with HMR
- `npm run build` — type-check via `tsc -b` then build for production with Vite
- `npm run lint` — run Oxlint
- `npm run preview` — preview the production build locally

There is no test runner configured.

Running the app requires Supabase credentials: copy `.env.example` to `.env` and set `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (`src/services/supabaseClient.ts` throws at import time if either is missing).

## Testing

Do not run tests (npm test, npx playwright test, vitest, jest, etc.) automatically after implementing a feature or fixing a bug. Only run tests when explicitly asked to.

## Architecture

Vite + React 19 + TypeScript SPA for an AI resume/job-match analyzer. There's no backend of our own — Supabase is used directly as the auth provider (see below). `react-router-dom` owns every URL in the app, including every in-shell screen as its own flat, top-level route (e.g. `/upload`, `/jobs/match`); a `Screen`-union façade (`useNav()`) sits on top of the in-shell routes to keep call sites simple (see below). No styling library or fetch library is used — don't introduce Tailwind or a fetch library without explicit instruction.

### Navigation is entirely router-driven, with a `Screen`-based façade inside the dashboard

`react-router-dom` (`BrowserRouter` in `src/main.tsx`) owns every route, defined in `src/App.tsx` via `PATHS` (`src/routes/paths.ts`) and `SCREEN_PATHS` (`src/features/app-shell/navConfig.ts`): `/` (welcome), `/register`, `/login`, `/onboarding`, `/dashboard`, and one flat top-level route per in-shell screen (e.g. `/upload`, `/review`, `/jobs/match`, `/generate/tailor`). Each pre-dashboard screen has a dedicated route-element component in `src/pages/` (`WelcomeRoute`, `RegisterRoute`, `LoginRoute`, `OnboardingRoute`) that owns the sign-up/sign-in submit handlers and their loading/error state — mirrors what the now-deleted `RootView.tsx` used to do in one file, just split per route. Email (welcome → register) and pending registration data (register → onboarding) travel via React Router's `navigate(path, { state })`, typed as `RegisterLocationState`/`OnboardingLocationState` with runtime type guards (no `any`) since `location.state` is `unknown`.

Every one of those routes is guarded, based on `useAuth().status` (see below):
- `RequireGuest` (`src/routes/RequireGuest.tsx`) wraps `/`, `/register`, `/login`, `/onboarding` — redirects to `/dashboard` if already authenticated.
- `RequireAuth` (`src/routes/RequireAuth.tsx`) wraps `DashboardRoute` (a pathless layout route in `App.tsx`, ancestor of `/dashboard` and every in-shell screen route) — redirects to `/login` if a guest.
- Both render `null` while `status === 'loading'` (the initial Supabase session check hasn't resolved yet) rather than redirecting, so neither an about-to-be-authenticated user nor a guest sees the wrong screen flash before the real status is known.
- An unmatched path falls through to a catch-all `<Route path="*">` that redirects to `/`.

Every sidebar screen has its own real, flat, deep-linkable, top-level URL (e.g. `/upload`, `/jobs/match`), defined directly in `src/App.tsx` as child `<Route>`s of a pathless `<Route element={<AppShell/>}>` layout route (itself nested inside the pathless, `RequireAuth`-guarded `DashboardRoute` layout route), and rendered inside `AppShell`'s `Sidebar`+`AppHeader` layout via `<Outlet/>`. `DashboardRoute` itself no longer owns any `<Route>`s — it's just `NavProvider` wrapping an `<Outlet/>`. Feature code never touches `react-router-dom` directly, though — it keeps using the pre-existing `Screen`-union façade: `NavContext`/`NavProvider` (`src/context/`) expose the current `Screen` (`src/types/index.ts`) and a `navigate(screen, options?)` function, plus sidebar-collapsed state, via the `useNav()` hook (`src/hooks/useNav.ts`) — never import `NavContext` directly in components (that split exists to satisfy Oxlint's `react/only-export-components`). Under the hood, `NavProvider` derives `screen` from the current URL (via `useLocation`, matched by exact pathname against `SCREEN_PATHS`, restricted to the in-shell subset of the `Screen` union) and `navigate()` looks up the target `Screen`'s path in `SCREEN_PATHS` and calls react-router's `navigate(path, { replace })` (via `useNavigate`) — so `navigate(screen, { replace: true })` still swaps the current history entry instead of pushing, and back/forward is handled entirely by the router now (no manual `pushState`/`popstate` code left). `navigate('welcome', ...)`, e.g. from Sidebar's logout, correctly leaves the authenticated subtree since `SCREEN_PATHS` covers the full `Screen` union, not just in-shell screens.

`src/features/app-shell/navConfig.ts` is the single source of truth for sidebar nav items (`NAV_SECTIONS`, `BOTTOM_NAV`), the per-screen page title (`SCREEN_TITLES`), and the per-screen URL (`SCREEN_PATHS`). Adding a new **in-shell** screen means: add it to the `Screen` union, add a section/page component under `src/features/<name>/`, add a `<Route>` for it in `App.tsx` (nested under the `AppShell` layout route), and add entries to `navConfig.ts` (`SCREEN_PATHS`, `SCREEN_TITLES`, and `NAV_SECTIONS`/`BOTTOM_NAV` if it should be reachable from the sidebar). Adding a new **top-level, pre-dashboard** route (rare) means: add a path to `PATHS`, a route-element component in `src/pages/`, a `<Route>` entry in `App.tsx` wrapped in the appropriate guard.

### Auth state

`AuthContext`/`AuthProvider` (`src/context/authContext.ts`, `src/context/AuthProvider.tsx`) track whether the current visitor is a guest or an authenticated user. `AuthProvider` wraps the whole app (outside the router's routes, inside `BrowserRouter`) and subscribes to `supabase.auth.onAuthStateChange`, treating its `INITIAL_SESSION` event as the source of truth (with a `getCurrentSession()` call as a seed for the brief window before that first event fires). Consume via `useAuth()` (`src/hooks/useAuth.ts`), which returns `{ status: 'loading' | 'authenticated' | 'guest', user, session }`. `status === 'loading'` is the window before the initial session check resolves — route guards (`RequireGuest`/`RequireAuth` above) must not redirect during that state. The Supabase client (`src/services/supabaseClient.ts`) is configured with `auth: { storage: window.sessionStorage }`, so sessions clear when the tab/window closes rather than persisting indefinitely like the SDK's `localStorage` default.

### Feature/component split

- `src/features/<name>/` — one folder per screen (welcome, register, login, onboarding, dashboard, upload, review, analysis, suggestions, jobs, generate, versions, skills, notifications, settings, app-shell). Each screen owns its own `.tsx` + co-located `.css`; some folders hold multiple related screens (e.g. `jobs/` has AddJob, Match, and Tracker; `generate/` has Tailor and CoverLetter).
- `src/components/` — shared presentational primitives (Button, Card, Badge, Chip, PillTag, Toggle, TextField, ProgressBar, ScoreRing, Icon, Logo), re-exported from `src/components/index.ts`. `Icon` wraps the Material Symbols Rounded font (loaded via Google Fonts `<link>` in `index.html`) — use it instead of adding an icon library. `TextField` auto-detects `type="password"` and renders a show/hide toggle internally — pass `type="password"` rather than building that toggle again in a screen.
- `src/services/` — `authService.ts` wraps Supabase Auth (`signUp`/`signIn`/`signOut`/`getCurrentSession`/`getCurrentUser`), throwing the raw Supabase `AuthError` on failure for callers to catch; `supabaseClient.ts` creates the singleton client from the `VITE_SUPABASE_*` env vars (configured to persist the session in `sessionStorage`, not the SDK's `localStorage` default). Beyond auth, there is no real backend: `resumeService.ts` is an intentionally stubbed, abortable async pipeline (`parseResume(onProgress, signal)`) shaped like a real streaming upload endpoint (`POST /resume/parse`) so callers won't need to change when a backend exists. `mockData.ts` holds typed fixtures (jobs, parsed resume, suggestions, etc.) consumed directly by screens until real data-fetching exists.
- `src/routes/` — router guards (`RequireGuest`, `RequireAuth`) and the `PATHS` constant; `src/pages/` holds the route-element components (`WelcomeRoute`, `RegisterRoute`, `LoginRoute`, `OnboardingRoute`, `DashboardRoute`). See "Navigation" above.
- `src/hooks/useResumeParsing.ts` is the pattern to follow for any future async flow: explicit `idle | parsing | done | error` status, `AbortController` cleanup on unmount/restart, and a ref-captured `onComplete` callback to avoid stale closures.
- `src/types/index.ts` is the single domain-model file (Screen, Job, ParsedResume, Suggestion, MatchDimension, SkillGap, AppNotification, etc.) — add new domain types here rather than inlining them in feature files.
- `src/styles/tokens.css` holds the design system as CSS custom properties (colors, ink/panel/border scales, accent/green/amber/red status colors, shadows, radius) ported from the original design reference; `index.css`/`patterns.css`/`App.css` build on top of it. Never hardcode a color/shadow/radius a token already covers.

### TypeScript / lint conventions

- Solution-style TS config: `tsconfig.json` references `tsconfig.app.json` (app source, strict, `verbatimModuleSyntax: true` — always use `import type` for type-only imports) and `tsconfig.node.json` (Vite config). `src/vite-env.d.ts` declares the `ImportMetaEnv` shape for the `VITE_SUPABASE_*` vars — extend it there when adding new `VITE_`-prefixed env vars.
- Linting is via Oxlint (`.oxlintrc.json`), not ESLint — `react/rules-of-hooks` is an error, `react/only-export-components` is a warning (this is why context value objects and hooks live in separate files from provider components). Type-aware lint rules are not enabled.

## Subagents

`.claude/agents/frontend.md` and `.claude/agents/backend.md` define scoped subagents for this project — frontend owns the browser-facing layer only, backend owns server-side concerns only. There's still no custom backend server in this repo (Supabase is used directly from the client as a hosted auth provider, not through a backend we control), so backend-agent work here would mean designing a real server if one gets introduced. Each agent stays within its boundary and defers cross-boundary changes back to the user rather than improvising across the line.
