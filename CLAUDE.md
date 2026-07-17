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

Vite + React 19 + TypeScript SPA for an AI resume/job-match analyzer. There's no backend of our own — Supabase is used directly as the auth provider (see below) — and no router or styling library; everything else is hand-rolled plain CSS + React state on purpose (see below), so don't introduce React Router, Tailwind, or a fetch library without explicit instruction.

### Navigation is state, not routing

There is no router dependency. The entire app is one `Screen` union type (`src/types/index.ts`) switched on in `src/pages/RootView.tsx`:

- `NavContext`/`NavProvider` (`src/context/`) hold the current `Screen` and a `navigate(screen, options?)` setter, plus sidebar-collapsed state. Consume via the `useNav()` hook (`src/hooks/useNav.ts`) — never import `NavContext` directly in components (that split exists to satisfy Oxlint's `react/only-export-components`). `NavProvider` mirrors every screen change into browser history via `pushState`/`replaceState` and listens for `popstate`, so the browser/OS back button walks back through screens the same way an in-app "Back" control does; in-app Back controls should call `window.history.back()` rather than `navigate()` directly to keep that one popstate handler as the single source of truth. `navigate(screen, { replace: true })` swaps the current history entry instead of pushing (used e.g. after register submits, so browser back from onboarding's first step lands on welcome, not the filled-out register form).
- `RootView` renders `WelcomeScreen`, `RegisterScreen`, `LoginScreen`, or `OnboardingScreen` full-bleed for the `welcome`/`register`/`login`/`onboarding` screens; every other screen renders inside `AppShell` (`src/features/app-shell/`), which provides the sidebar/header chrome. `RootView` also owns the sign-up/sign-in submit handlers (calling `authService`) and their loading/error state, since those screens are pre-shell and have no shared layout to hoist that state into.
- `src/features/app-shell/navConfig.ts` is the single source of truth for sidebar nav items (`NAV_SECTIONS`, `BOTTOM_NAV`) and the per-screen page title (`SCREEN_TITLES`). Adding a new screen means: add it to the `Screen` union, add a section/page component under `src/features/<name>/`, wire it into `RootView`'s switch, and add an entry to `navConfig.ts` if it should be reachable from the sidebar.

### Feature/component split

- `src/features/<name>/` — one folder per screen (welcome, register, login, onboarding, dashboard, upload, review, analysis, suggestions, jobs, generate, versions, skills, notifications, settings, app-shell). Each screen owns its own `.tsx` + co-located `.css`; some folders hold multiple related screens (e.g. `jobs/` has AddJob, Match, and Tracker; `generate/` has Tailor and CoverLetter).
- `src/components/` — shared presentational primitives (Button, Card, Badge, Chip, PillTag, Toggle, TextField, ProgressBar, ScoreRing, Icon, Logo), re-exported from `src/components/index.ts`. `Icon` wraps the Material Symbols Rounded font (loaded via Google Fonts `<link>` in `index.html`) — use it instead of adding an icon library. `TextField` auto-detects `type="password"` and renders a show/hide toggle internally — pass `type="password"` rather than building that toggle again in a screen.
- `src/services/` — `authService.ts` wraps Supabase Auth (`signUp`/`signIn`/`signOut`/`getCurrentSession`/`getCurrentUser`), throwing the raw Supabase `AuthError` on failure for callers to catch; `supabaseClient.ts` creates the singleton client from the `VITE_SUPABASE_*` env vars. Beyond auth, there is no real backend: `resumeService.ts` is an intentionally stubbed, abortable async pipeline (`parseResume(onProgress, signal)`) shaped like a real streaming upload endpoint (`POST /resume/parse`) so callers won't need to change when a backend exists. `mockData.ts` holds typed fixtures (jobs, parsed resume, suggestions, etc.) consumed directly by screens until real data-fetching exists.
- `src/hooks/useResumeParsing.ts` is the pattern to follow for any future async flow: explicit `idle | parsing | done | error` status, `AbortController` cleanup on unmount/restart, and a ref-captured `onComplete` callback to avoid stale closures.
- `src/types/index.ts` is the single domain-model file (Screen, Job, ParsedResume, Suggestion, MatchDimension, SkillGap, AppNotification, etc.) — add new domain types here rather than inlining them in feature files.
- `src/styles/tokens.css` holds the design system as CSS custom properties (colors, ink/panel/border scales, accent/green/amber/red status colors, shadows, radius) ported from the original design reference; `index.css`/`patterns.css`/`App.css` build on top of it. Never hardcode a color/shadow/radius a token already covers.

### TypeScript / lint conventions

- Solution-style TS config: `tsconfig.json` references `tsconfig.app.json` (app source, strict, `verbatimModuleSyntax: true` — always use `import type` for type-only imports) and `tsconfig.node.json` (Vite config). `src/vite-env.d.ts` declares the `ImportMetaEnv` shape for the `VITE_SUPABASE_*` vars — extend it there when adding new `VITE_`-prefixed env vars.
- Linting is via Oxlint (`.oxlintrc.json`), not ESLint — `react/rules-of-hooks` is an error, `react/only-export-components` is a warning (this is why context value objects and hooks live in separate files from provider components). Type-aware lint rules are not enabled.

## Subagents

`.claude/agents/frontend.md` and `.claude/agents/backend.md` define scoped subagents for this project — frontend owns the browser-facing layer only, backend owns server-side concerns only. There's still no custom backend server in this repo (Supabase is used directly from the client as a hosted auth provider, not through a backend we control), so backend-agent work here would mean designing a real server if one gets introduced. Each agent stays within its boundary and defers cross-boundary changes back to the user rather than improvising across the line.
