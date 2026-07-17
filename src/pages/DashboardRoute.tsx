import { NavProvider } from '../context/NavProvider';
import { AppShell } from '../features/app-shell/AppShell';

/**
 * The authenticated app shell lives at a single URL — everything inside it
 * (upload, jobs, settings, etc.) is driven by NavContext's `screen` state,
 * not the router, so the URL bar doesn't change as the user clicks around.
 */
export function DashboardRoute() {
  return (
    <NavProvider initialScreen="dashboard">
      <AppShell />
    </NavProvider>
  );
}
