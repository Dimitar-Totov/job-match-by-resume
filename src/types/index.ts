export type Screen =
  | 'welcome'
  | 'register'
  | 'login'
  | 'onboarding'
  | 'dashboard'
  | 'upload'
  | 'parse'
  | 'analysis'
  | 'suggestions'
  | 'addjob'
  | 'match'
  | 'tailor'
  | 'cover'
  | 'tracker'
  | 'versions'
  | 'skills'
  | 'notifications'
  | 'settings';

export type ScoreLevel = 'good' | 'warn' | 'bad';

export type JobStatus = 'saved' | 'applied' | 'interview' | 'offer' | 'rejected';

export interface Job {
  id: number;
  company: string;
  title: string;
  mark: string;
  color: string;
  score: number;
  location: string;
  posted: string;
  status: JobStatus;
  deadline: string;
}

export interface ScoreBar {
  label: string;
  value: number;
  tone: 'accent' | 'amber';
}

export interface ChecklistItem {
  text: string;
  done: boolean;
}

export interface StatCard {
  icon: string;
  label: string;
  value: string;
  delta: string;
}

export interface SkillGapMini {
  skill: string;
  freq: number;
  pct: number;
}

export interface EducationEntry {
  school: string;
  degree: string;
  year: string;
  extra: string;
}

export interface ExperienceEntry {
  role: string;
  company: string;
  dates: string;
  bullets: string[];
}

export interface ParsedResume {
  name: string;
  email: string;
  phone: string;
  location: string;
  education: EducationEntry[];
  skills: string[];
  experience: ExperienceEntry[];
}

export type ResumeStatus = 'pending' | 'parsed' | 'failed';

/**
 * Analysis lifecycle on the resume row: null (never analyzed) | ready (analysis
 * stored) | failed (analysis run failed). Set by the `resume-analyze` Edge
 * Function; the client treats a null `analysis` as "not analyzed yet".
 */
export type AnalysisStatus = 'ready' | 'failed';

/**
 * Suggestions lifecycle on the resume row: null (never generated) | ready
 * (suggestions stored, possibly an empty list) | failed (generation failed).
 * Set by the `resume-suggest` Edge Function.
 */
export type SuggestionsStatus = 'ready' | 'failed';

/**
 * A row of the `resumes` table (supabase/migrations/20260722000000): the raw
 * uploaded file's location in the private "resumes" Storage bucket plus its
 * AI-extracted structured data. `parsed` is null until parsing succeeds;
 * `analysis` is null until the resume-analyze function has run (see the
 * 20260723000000 migration that adds the `analysis`/`analysis_status` columns).
 */
export interface ResumeRecord {
  user_id: string;
  storage_path: string | null;
  file_name: string | null;
  parsed: ParsedResume | null;
  status: ResumeStatus;
  analysis: ResumeAnalysis | null;
  analysis_status: AnalysisStatus | null;
  suggestions: Suggestion[] | null;
  suggestions_status: SuggestionsStatus | null;
  created_at: string;
  updated_at: string;
}

export interface AnalysisSection {
  name: string;
  score: number;
  note: string;
  level: ScoreLevel;
}

export interface AtsCheck {
  label: string;
  pass: boolean;
}

export interface WritingIssue {
  type: string;
  severity: 'warn' | 'bad';
  text: string;
  fix: string;
}

/** Headline verdict shown at the top of the analysis screen. */
export interface AnalysisSummary {
  /** Drives the badge tone/icon and overall framing. */
  tone: ScoreLevel;
  /** Short badge text, e.g. "Strong resume". */
  label: string;
  /** One-line encouraging headline. */
  headline: string;
  /** A sentence or two of overall guidance. */
  body: string;
}

/** A single high-impact, one-line fix the user can act on. */
export interface QuickWin {
  label: string;
  /** Estimated score increase as a signed string, e.g. "+6". */
  gain: string;
}

/**
 * The full AI analysis of a parsed resume, produced by the `resume-analyze`
 * Edge Function and stored as jsonb on the resume row (`resumes.analysis`).
 * Drives the entire AnalysisScreen.
 */
export interface ResumeAnalysis {
  /** Overall resume quality, 0–100. */
  overallScore: number;
  summary: AnalysisSummary;
  ats: {
    score: number;
    checks: AtsCheck[];
  };
  sections: AnalysisSection[];
  writingIssues: WritingIssue[];
  quickWins: QuickWin[];
  /** overallScore projected if every quick win is applied (>= overallScore). */
  projectedScore: number;
}

export type SuggestionState = 'pending' | 'accepted' | 'rejected';

/**
 * An AI-generated rewrite suggestion for one resume line (produced by the
 * `resume-suggest` Edge Function and stored as jsonb on the resume row). `state`
 * is the user's persisted decision; the resume text itself is never modified —
 * accepting a suggestion only records the decision.
 */
export interface Suggestion {
  id: number;
  section: string;
  before: string;
  after: string;
  tags: string[];
  state: SuggestionState;
}

export interface MatchDimension {
  label: string;
  pct: number;
}

export interface KeywordGap {
  keyword: string;
  present: boolean;
}

export interface ResumeVersion {
  tag: string;
  name: string;
  date: string;
  score: number;
  current: boolean;
  note: string;
}

export interface LearningCourse {
  name: string;
  provider: string;
  length: string;
}

export interface SkillGap {
  skill: string;
  freq: number;
  of: number;
  courses: LearningCourse[];
}

export type NotificationTone = 'amber' | 'green' | 'accent';

export interface AppNotification {
  id: number;
  icon: string;
  tone: NotificationTone;
  title: string;
  body: string;
  time: string;
  unread: boolean;
  cta: string;
}

export interface SettingItem {
  key: string;
  label: string;
  desc: string;
}

export interface CoverTone {
  key: string;
  label: string;
  desc: string;
}

export interface Profile {
  id: string;
  username: string | null;
  email: string | null;
  field_of_study: string | null;
  graduation_year: string | null;
  target_roles: string[] | null;
  target_industries: string[] | null;
  experience_level: string | null;
  created_at: string;
  updated_at: string;
}
