-- Add AI rewrite suggestions to the resumes table.
--
-- The `resume-suggest` Edge Function reads a user's already-parsed resume
-- (public.resumes.parsed), asks the AI model for a list of concrete before/after
-- rewrite suggestions, and stores them here. Each suggestion also carries the
-- user's accept/reject decision (`state`), persisted so it survives navigation
-- and refresh. The resume text itself is never modified — accepting only records
-- the decision.
--
-- Like the analysis columns (20260723000000), these are just two more columns on
-- the existing 1:1 resume row, so the owner-scoped RLS policies and the
-- set_updated_at() trigger from 20260722000000 already cover them.

alter table public.resumes
  add column if not exists suggestions jsonb,
  add column if not exists suggestions_status text;

comment on column public.resumes.suggestions is
  'AI-generated rewrite suggestions as jsonb (array matching the Suggestion type in src/types/index.ts): { id, section, before, after, tags, state }. Each item embeds the user''s accept/reject decision. Null until suggestions are generated.';
comment on column public.resumes.suggestions_status is
  'null (never generated) | ready (suggestions stored, possibly an empty list) | failed (generation failed). Written by the resume-suggest Edge Function.';
