import { useEffect, useRef } from 'react';
import { useNav } from '../../hooks/useNav';
import type { Screen } from '../../types';
import { Sidebar } from './Sidebar';
import { AppHeader } from './AppHeader';
import { DashboardScreen } from '../dashboard/DashboardScreen';
import { UploadScreen } from '../upload/UploadScreen';
import { ReviewScreen } from '../review/ReviewScreen';
import { AnalysisScreen } from '../analysis/AnalysisScreen';
import { SuggestionsScreen } from '../suggestions/SuggestionsScreen';
import { AddJobScreen } from '../jobs/AddJobScreen';
import { MatchScreen } from '../jobs/MatchScreen';
import { TrackerScreen } from '../jobs/TrackerScreen';
import { TailorScreen } from '../generate/TailorScreen';
import { CoverLetterScreen } from '../generate/CoverLetterScreen';
import { VersionsScreen } from '../versions/VersionsScreen';
import { SkillsScreen } from '../skills/SkillsScreen';
import { NotificationsScreen } from '../notifications/NotificationsScreen';
import { SettingsScreen } from '../settings/SettingsScreen';
import './AppShell.css';

const SCREENS: Partial<Record<Screen, () => React.ReactElement>> = {
  dashboard: DashboardScreen,
  upload: UploadScreen,
  parse: ReviewScreen,
  analysis: AnalysisScreen,
  suggestions: SuggestionsScreen,
  addjob: AddJobScreen,
  match: MatchScreen,
  tracker: TrackerScreen,
  tailor: TailorScreen,
  cover: CoverLetterScreen,
  versions: VersionsScreen,
  skills: SkillsScreen,
  notifications: NotificationsScreen,
  settings: SettingsScreen,
};

export function AppShell() {
  const { screen } = useNav();
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [screen]);

  const Screen = SCREENS[screen] ?? DashboardScreen;

  return (
    <div className="shell">
      <Sidebar />
      <div className="shell__main">
        <AppHeader />
        <main className="shell__content" ref={mainRef} tabIndex={-1}>
          <Screen />
        </main>
      </div>
    </div>
  );
}
