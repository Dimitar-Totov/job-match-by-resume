-- Drop the AI rewrite-suggestions columns added in 20260724000000.
--
-- The AI-improvement suggestions feature (resume-suggest Edge Function + the
-- suggestions/suggestions_status columns it wrote) has been removed from the
-- app. The resume flow going forward is parse -> review -> analyze only.

alter table public.resumes
  drop column if exists suggestions,
  drop column if exists suggestions_status;
