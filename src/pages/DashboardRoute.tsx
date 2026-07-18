import { Outlet } from 'react-router-dom';
import { NavProvider } from '../context/NavProvider';

/**
 * Auth-guarded layout for every in-shell screen. Each in-shell screen is a
 * flat, top-level route (e.g. `/upload`, `/review`, `/jobs/match`) defined
 * in `App.tsx`, sharing this `NavProvider` plus the `AppShell`
 * (Sidebar/AppHeader) layout further down the route tree.
 */
export function DashboardRoute() {
  return (
    <NavProvider>
      <Outlet />
    </NavProvider>
  );
}
