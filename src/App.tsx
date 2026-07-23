import { Navigate, Route, Routes } from 'react-router-dom'
import './styles/App.css'
import { AuthProvider } from './context/AuthProvider'
import { AppShell } from './features/app-shell/AppShell'
import { SCREEN_PATHS } from './features/app-shell/navConfig'
import { DashboardScreen } from './features/dashboard/DashboardScreen'
import { UploadScreen } from './features/upload/UploadScreen'
import { ReviewScreen } from './features/review/ReviewScreen'
import { AnalysisScreen } from './features/analysis/AnalysisScreen'
import { AddJobScreen } from './features/jobs/AddJobScreen'
import { MatchScreen } from './features/jobs/MatchScreen'
import { TrackerScreen } from './features/jobs/TrackerScreen'
import { TailorScreen } from './features/generate/TailorScreen'
import { CoverLetterScreen } from './features/generate/CoverLetterScreen'
import { SkillsScreen } from './features/skills/SkillsScreen'
import { NotificationsScreen } from './features/notifications/NotificationsScreen'
import { SettingsScreen } from './features/settings/SettingsScreen'
import { DashboardRoute } from './pages/DashboardRoute'
import { LoginRoute } from './pages/LoginRoute'
import { OnboardingRoute } from './pages/OnboardingRoute'
import { RegisterRoute } from './pages/RegisterRoute'
import { WelcomeRoute } from './pages/WelcomeRoute'
import { RequireAuth } from './routes/RequireAuth'
import { RequireGuest } from './routes/RequireGuest'
import { PATHS } from './routes/paths'

function App() {
  return (
    <div className="app-root">
      <AuthProvider>
        <Routes>
          <Route
            path={PATHS.welcome}
            element={(
              <RequireGuest>
                <WelcomeRoute />
              </RequireGuest>
            )}
          />
          <Route
            path={PATHS.register}
            element={(
              <RequireGuest>
                <RegisterRoute />
              </RequireGuest>
            )}
          />
          <Route
            path={PATHS.login}
            element={(
              <RequireGuest>
                <LoginRoute />
              </RequireGuest>
            )}
          />
          <Route
            path={PATHS.onboarding}
            element={(
              <RequireGuest>
                <OnboardingRoute />
              </RequireGuest>
            )}
          />
          <Route
            element={(
              <RequireAuth>
                <DashboardRoute />
              </RequireAuth>
            )}
          >
            <Route element={<AppShell />}>
              <Route path={SCREEN_PATHS.dashboard} element={<DashboardScreen />} />
              <Route path={SCREEN_PATHS.upload} element={<UploadScreen />} />
              <Route path={SCREEN_PATHS.parse} element={<ReviewScreen />} />
              <Route path={SCREEN_PATHS.analysis} element={<AnalysisScreen />} />
              <Route path={SCREEN_PATHS.addjob} element={<AddJobScreen />} />
              <Route path={SCREEN_PATHS.match} element={<MatchScreen />} />
              <Route path={SCREEN_PATHS.tracker} element={<TrackerScreen />} />
              <Route path={SCREEN_PATHS.tailor} element={<TailorScreen />} />
              <Route path={SCREEN_PATHS.cover} element={<CoverLetterScreen />} />
              <Route path={SCREEN_PATHS.skills} element={<SkillsScreen />} />
              <Route path={SCREEN_PATHS.notifications} element={<NotificationsScreen />} />
              <Route path={SCREEN_PATHS.settings} element={<SettingsScreen />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to={PATHS.welcome} replace />} />
        </Routes>
      </AuthProvider>
    </div>
  )
}

export default App
