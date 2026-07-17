import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginScreen } from '../features/login/LoginScreen';
import { signIn } from '../services/authService';
import { PATHS } from '../routes/paths';

export function LoginRoute() {
  const navigate = useNavigate();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLogin = (data: { email: string; password: string }) => {
    if (isLoggingIn) return;

    setLoginError(null);
    setIsLoggingIn(true);

    signIn(data.email, data.password)
      .then(() => {
        navigate(PATHS.dashboard);
      })
      .catch((err: unknown) => {
        const message =
          err instanceof Error
            ? err.message
            : 'Could not log in. Please check your email and password and try again.';
        setLoginError(message);
      })
      .finally(() => {
        setIsLoggingIn(false);
      });
  };

  return <LoginScreen onSubmit={handleLogin} isSubmitting={isLoggingIn} error={loginError} />;
}
