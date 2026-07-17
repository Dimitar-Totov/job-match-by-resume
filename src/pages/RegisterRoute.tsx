import { useLocation, useNavigate } from 'react-router-dom';
import { RegisterScreen } from '../features/register/RegisterScreen';
import { PATHS } from '../routes/paths';
import type { OnboardingLocationState } from './OnboardingRoute';

export interface RegisterLocationState {
  email: string;
}

function isRegisterLocationState(state: unknown): state is RegisterLocationState {
  return (
    typeof state === 'object' && state !== null && typeof (state as { email?: unknown }).email === 'string'
  );
}

export function RegisterRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const pendingEmail = isRegisterLocationState(location.state) ? location.state.email : '';

  return (
    <RegisterScreen
      onSubmit={(data) => {
        const registration: OnboardingLocationState['registration'] = {
          ...data,
          email: pendingEmail,
        };
        // Replace rather than push: the filled register form isn't a
        // meaningful back-stop once submitted, so browser/in-app back from
        // onboarding's first step should land on welcome, not register.
        navigate(PATHS.onboarding, {
          replace: true,
          state: { registration } satisfies OnboardingLocationState,
        });
      }}
    />
  );
}
