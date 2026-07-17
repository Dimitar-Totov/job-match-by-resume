import { Navigate, Route, Routes } from 'react-router-dom'
import './styles/App.css'
import { AuthProvider } from './context/AuthProvider'
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
            path={PATHS.dashboard}
            element={(
              <RequireAuth>
                <DashboardRoute />
              </RequireAuth>
            )}
          />
          <Route path="*" element={<Navigate to={PATHS.welcome} replace />} />
        </Routes>
      </AuthProvider>
    </div>
  )
}

export default App
