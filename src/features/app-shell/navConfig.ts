import type { Screen } from '../../types';
import { PATHS } from '../../routes/paths';

export interface NavItem {
  icon: string;
  label: string;
  screen: Screen;
  badge?: string;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  { label: '', items: [{ icon: 'space_dashboard', label: 'Dashboard', screen: 'dashboard' }] },
  {
    label: 'Resume',
    items: [
      { icon: 'upload_file', label: 'Upload', screen: 'upload' },
      { icon: 'fact_check', label: 'Review', screen: 'parse' },
      { icon: 'insights', label: 'Analysis', screen: 'analysis' },
    ],
  },
  {
    label: 'Jobs',
    items: [
      { icon: 'add_box', label: 'Add job', screen: 'addjob' },
      { icon: 'track_changes', label: 'Match results', screen: 'match' },
      { icon: 'view_kanban', label: 'Tracker', screen: 'tracker' },
    ],
  },
  {
    label: 'Generate',
    items: [
      { icon: 'edit_document', label: 'Tailored resume', screen: 'tailor' },
      { icon: 'drafts', label: 'Cover letter', screen: 'cover' },
    ],
  },
  { label: 'Grow', items: [{ icon: 'trending_up', label: 'Skill gap', screen: 'skills' }] },
];

export const BOTTOM_NAV: NavItem[] = [
  { icon: 'notifications', label: 'Notifications', screen: 'notifications', badge: '3' },
];

/**
 * Absolute URL path for every `Screen` value. The five pre-dashboard
 * screens reuse `PATHS` (router-driven); the in-shell screens are flat,
 * top-level routes defined directly in `App.tsx`, sharing the `AppShell`
 * layout alongside `dashboard` itself.
 */
export const SCREEN_PATHS: Record<Screen, string> = {
  welcome: PATHS.welcome,
  register: PATHS.register,
  login: PATHS.login,
  onboarding: PATHS.onboarding,
  dashboard: PATHS.dashboard,
  upload: '/resume/upload',
  parse: '/resume/review',
  analysis: '/resume/analysis',
  addjob: '/jobs/add',
  match: '/jobs/match',
  tracker: '/jobs/tracker',
  tailor: '/generate/tailor',
  cover: '/generate/cover',
  skills: '/skills',
  notifications: '/notifications',
  settings: '/profile',
};

export const SCREEN_TITLES: Record<Screen, string> = {
  welcome: 'Welcome',
  register: 'Create account',
  login: 'Log in',
  onboarding: 'Onboarding',
  dashboard: 'Dashboard',
  upload: 'Upload resume',
  parse: 'Review parsed resume',
  analysis: 'Resume analysis',
  addjob: 'Add a job',
  match: 'Job match results',
  tailor: 'Tailored resume',
  cover: 'Cover letter',
  tracker: 'Job tracker',
  skills: 'Skill gap & learning',
  notifications: 'Notifications',
  settings: 'Profile & settings',
};
