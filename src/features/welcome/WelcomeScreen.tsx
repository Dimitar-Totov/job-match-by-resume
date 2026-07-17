import { useState } from 'react';
import { Button, Icon } from '../../components';
import { Logo } from '../../components/Logo';
import './WelcomeScreen.css';

interface WelcomeScreenProps {
  onContinue: () => void;
  onCreateAccount: (email: string) => void;
  onLogin: () => void;
}

export function WelcomeScreen({ onContinue, onCreateAccount, onLogin }: WelcomeScreenProps) {
  const [email, setEmail] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onCreateAccount(email);
  };

  return (
    <div className="welcome">
      <div className="welcome__panel">
        <div className="welcome__brand">
          <Logo size="lg" />
        </div>
        <div className="welcome__intro">
          <span className="welcome__eyebrow">
            <Icon name="auto_awesome" size={16} />
            AI resume &amp; job-match analyzer
          </span>
          <h1 className="welcome__title">Land the job your resume deserves.</h1>
          <p className="welcome__lede">
            Score your resume against any job in seconds, get AI rewrites that beat the bots, and
            track every application in one place.
          </p>

          <form className="welcome__form" onSubmit={handleSubmit}>
            <label className="sr-only" htmlFor="welcome-email">
              Email address
            </label>
            <input
              id="welcome-email"
              type="email"
              className="welcome__email"
              placeholder="you@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
            />
            <Button type="submit" size="lg" trailingIcon="arrow_forward" fullWidth>
              Create free account
            </Button>
            <div className="welcome__divider">
              <span>or</span>
            </div>
            <Button type="button" variant="secondary" size="lg" fullWidth onClick={onContinue}>
              <span className="welcome__google" aria-hidden="true" />
              Continue with Google
            </Button>
          </form>

          <p className="welcome__login">
            Already have an account?{' '}
            <button type="button" className="welcome__link" onClick={onLogin}>
              Log in
            </button>
          </p>
        </div>
        <p className="welcome__terms">By continuing you agree to our Terms &amp; Privacy Policy.</p>
      </div>
    </div>
  );
}
