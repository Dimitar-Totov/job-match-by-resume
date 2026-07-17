import { useState } from 'react';
import { useNav } from '../hooks/useNav';
import { WelcomeScreen } from '../features/welcome/WelcomeScreen';
import { RegisterScreen } from '../features/register/RegisterScreen';
import { LoginScreen } from '../features/login/LoginScreen';
import { OnboardingScreen } from '../features/onboarding/OnboardingScreen';
import { AppShell } from '../features/app-shell/AppShell';
import { signIn, signUp } from '../services/authService';

/**
 * Top-level view switch. Welcome, register, and onboarding are full-bleed
 * screens shown before the authenticated app shell; everything else renders
 * inside the shell. A router dependency is intentionally avoided at this
 * stage — the active "screen" is simple client state held in NavContext.
 */
export function RootView() {
  const { screen, navigate } = useNav();
  const [pendingEmail, setPendingEmail] = useState('');
  const [registration, setRegistration] = useState<{
    username: string;
    email: string;
    password: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

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
        navigate('dashboard');
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

  const handleLogin = (data: { email: string; password: string }) => {
    if (isLoggingIn) return;

    setLoginError(null);
    setIsLoggingIn(true);

    signIn(data.email, data.password)
      .then(() => {
        navigate('dashboard');
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

  if (screen === 'welcome') {
    return (
      <WelcomeScreen
        onContinue={() => navigate('onboarding')}
        onCreateAccount={(email) => {
          setPendingEmail(email);
          navigate('register');
        }}
        onLogin={() => navigate('login')}
      />
    );
  }

  if (screen === 'register') {
    return (
      <RegisterScreen
        onSubmit={(data) => {
          setRegistration({ ...data, email: pendingEmail });
          // Replace rather than push: the filled register form isn't a
          // meaningful back-stop once submitted, so browser/in-app back from
          // onboarding's first step should land on welcome, not register.
          navigate('onboarding', { replace: true });
        }}
      />
    );
  }

  if (screen === 'login') {
    return (
      <LoginScreen
        onSubmit={handleLogin}
        isSubmitting={isLoggingIn}
        error={loginError}
      />
    );
  }

  if (screen === 'onboarding') {
    return (
      <OnboardingScreen onComplete={handleFinishSetup} isSubmitting={isSubmitting} error={authError} />
    );
  }

  return <AppShell />;
}
