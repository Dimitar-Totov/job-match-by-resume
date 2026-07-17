import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { OnboardingScreen } from '../features/onboarding/OnboardingScreen';
import { signUp } from '../services/authService';
import { PATHS } from '../routes/paths';

export interface OnboardingLocationState {
  registration: {
    username: string;
    email: string;
    password: string;
  };
}

function isOnboardingLocationState(state: unknown): state is OnboardingLocationState {
  if (typeof state !== 'object' || state === null) return false;
  const registration = (state as { registration?: unknown }).registration;
  return (
    typeof registration === 'object' &&
    registration !== null &&
    typeof (registration as { email?: unknown }).email === 'string' &&
    typeof (registration as { username?: unknown }).username === 'string' &&
    typeof (registration as { password?: unknown }).password === 'string'
  );
}

export function OnboardingRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Onboarding is normally reached via a successful register submit, which
  // carries the pending registration in router state — but it's also
  // reachable via "Continue with Google" straight from welcome, with no
  // registration to submit yet. Matches pre-router behavior: the wizard
  // still renders either way; only finishing without a registration surfaces
  // an inline error instead of silently crashing on missing data.
  const registration = isOnboardingLocationState(location.state)
    ? location.state.registration
    : null;

  const handleFinishSetup = () => {
    if (isSubmitting) return;

    if (!registration) {
      setAuthError('Something went wrong — please register again.');
      return;
    }

    setAuthError(null);
    setIsSubmitting(true);

    signUp(registration.email, registration.password)
      .then(() => {
        navigate(PATHS.dashboard);
      })
      .catch((err: unknown) => {
        const message =
          err instanceof Error ? err.message : 'Could not create your account. Please try again.';
        setAuthError(message);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <OnboardingScreen onComplete={handleFinishSetup} isSubmitting={isSubmitting} error={authError} />
  );
}
