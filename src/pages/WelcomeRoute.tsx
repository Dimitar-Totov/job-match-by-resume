import { useNavigate } from 'react-router-dom';
import { WelcomeScreen } from '../features/welcome/WelcomeScreen';
import { PATHS } from '../routes/paths';
import type { RegisterLocationState } from './RegisterRoute';

export function WelcomeRoute() {
  const navigate = useNavigate();

  return (
    <WelcomeScreen
      onContinue={() => navigate(PATHS.onboarding)}
      onCreateAccount={(email) => {
        navigate(PATHS.register, { state: { email } satisfies RegisterLocationState });
      }}
      onLogin={() => navigate(PATHS.login)}
    />
  );
}
