import { useNav } from '../hooks/useNav';
import { WelcomeScreen } from '../features/welcome/WelcomeScreen';
import { OnboardingScreen } from '../features/onboarding/OnboardingScreen';
import { AppShell } from '../features/app-shell/AppShell';

/**
 * Top-level view switch. Welcome and onboarding are full-bleed screens shown
 * before the authenticated app shell; everything else renders inside the shell.
 * A router dependency is intentionally avoided at this stage — the active
 * "screen" is simple client state held in NavContext.
 */
export function RootView() {
  const { screen, navigate } = useNav();

  if (screen === 'welcome') {
    return <WelcomeScreen onContinue={() => navigate('onboarding')} />;
  }

  if (screen === 'onboarding') {
    return (
      <OnboardingScreen
        onComplete={() => navigate('dashboard')}
        onExit={() => navigate('welcome')}
      />
    );
  }

  return <AppShell />;
}
