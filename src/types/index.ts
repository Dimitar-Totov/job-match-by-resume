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

export type SuggestionState = 'pending' | 'accepted' | 'rejected';

export interface Suggestion {
  id: number;
  section: string;
  before: string;
  after: string;
  tags: string[];
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
