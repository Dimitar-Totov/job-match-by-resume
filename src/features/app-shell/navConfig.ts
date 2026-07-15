import type { Screen } from '../../types';

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
    label: 'Résumé',
    items: [
      { icon: 'upload_file', label: 'Upload', screen: 'upload' },
      { icon: 'fact_check', label: 'Review', screen: 'parse' },
      { icon: 'insights', label: 'Analysis', screen: 'analysis' },
      { icon: 'auto_awesome', label: 'AI Improve', screen: 'suggestions' },
      { icon: 'history', label: 'Versions', screen: 'versions' },
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
      { icon: 'edit_document', label: 'Tailored résumé', screen: 'tailor' },
      { icon: 'drafts', label: 'Cover letter', screen: 'cover' },
    ],
  },
  { label: 'Grow', items: [{ icon: 'trending_up', label: 'Skill gap', screen: 'skills' }] },
];

export const BOTTOM_NAV: NavItem[] = [
  { icon: 'notifications', label: 'Notifications', screen: 'notifications', badge: '3' },
  { icon: 'settings', label: 'Settings', screen: 'settings' },
];

export const SCREEN_TITLES: Record<Screen, string> = {
  welcome: 'Welcome',
  onboarding: 'Onboarding',
  dashboard: 'Dashboard',
  upload: 'Upload résumé',
  parse: 'Review parsed résumé',
  analysis: 'Résumé analysis',
  suggestions: 'AI improvements',
  addjob: 'Add a job',
  match: 'Job match results',
  tailor: 'Tailored résumé',
  cover: 'Cover letter',
  tracker: 'Job tracker',
  versions: 'Versions & history',
  skills: 'Skill gap & learning',
  notifications: 'Notifications',
  settings: 'Profile & settings',
};
