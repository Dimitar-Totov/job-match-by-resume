# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start the Vite dev server with HMR
- `npm run build` — type-check via `tsc -b` then build for production with Vite
- `npm run lint` — run Oxlint
- `npm run preview` — preview the production build locally

There is no test runner configured yet.

## Architecture

This is a Vite + React 19 + TypeScript SPA, currently at an early scaffold stage — most feature directories under `src/` (`components`, `context`, `features`, `hooks`, `pages`, `services`, `utils`) exist but are empty. `src/App.tsx` renders a placeholder hero section.

Intended structure based on the directory layout already in place:
- `src/features/` — feature-scoped modules (e.g. `auth`, `profile`) bundling their own components/logic
- `src/components/` — shared, reusable UI components (e.g. `Button`, `Modal`, `Navbar`)
- `src/pages/` — route-level views
- `src/context/` — React context providers for cross-cutting client state
- `src/services/` — API/data-fetching layer
- `src/hooks/` — shared custom hooks
- `src/utils/` — framework-agnostic helpers
- `src/styles/` — global CSS (`index.css`, `App.css`)

TypeScript project uses solution-style config: `tsconfig.json` references `tsconfig.app.json` (app source) and `tsconfig.node.json` (Vite config).

Linting is via Oxlint (`.oxlintrc.json`), not ESLint. Current config enables `react`, `typescript`, and `oxc` plugins with `react/rules-of-hooks` as an error. Type-aware lint rules are not yet enabled (would require `oxlint-tsgolint`).

## Subagents

`.claude/agents/frontend.md` and `.claude/agents/backend.md` define scoped subagents for this project — frontend owns the browser-facing layer only, backend owns server-side concerns only (no backend exists in this repo yet). Each stays within its boundary and defers cross-boundary changes back to the user rather than improvising across the line.
