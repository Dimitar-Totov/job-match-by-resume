-- Add AI analysis to the resumes table.
--
-- The `resume-analyze` Edge Function reads a user's already-parsed resume
-- (public.resumes.parsed), asks the AI model to score and critique it, and
-- stores the structured result here. Analysis is 1:1 with the resume and the
-- resumes table is already 1:1 with auth.users, so these are just two more
-- columns on the existing row rather than a new table — the owner-scoped RLS
-- policies and the set_updated_at() trigger from 20260722000000 already cover
-- them, so nothing else to add.

alter table public.resumes
  add column if not exists analysis jsonb,
  add column if not exists analysis_status text;

comment on column public.resumes.analysis is
  'AI-generated resume analysis as jsonb (matches the ResumeAnalysis type in src/types/index.ts): overall score, ATS checks, section-by-section feedback, writing issues, and quick wins. Null until analysis succeeds.';
comment on column public.resumes.analysis_status is
  'null (never analyzed) | ready (analysis stored) | failed (analysis run failed). Written by the resume-analyze Edge Function.';
