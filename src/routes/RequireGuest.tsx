import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { PATHS } from './paths';

interface RequireGuestProps {
  children: ReactNode;
}

/**
 * Guards pre-auth routes (welcome/register/login/onboarding). Renders
 * nothing while the initial session check is in flight so an about-to-be
 * authenticated user never sees the form flash before being redirected.
 */
export function RequireGuest({ children }: RequireGuestProps) {
  const { status } = useAuth();

  if (status === 'loading') {
    return null;
  }

  if (status === 'authenticated') {
    return <Navigate to={PATHS.dashboard} replace />;
  }

  return children;
}
