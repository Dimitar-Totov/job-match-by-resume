import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { PATHS } from './paths';

interface RequireAuthProps {
  children: ReactNode;
}

/**
 * Guards the authenticated app shell (dashboard). Renders nothing while the
 * initial session check is in flight so a guest never sees dashboard
 * content flash before being redirected.
 */
export function RequireAuth({ children }: RequireAuthProps) {
  const { status } = useAuth();

  if (status === 'loading') {
    return null;
  }

  if (status === 'guest') {
    return <Navigate to={PATHS.login} replace />;
  }

  return children;
}
