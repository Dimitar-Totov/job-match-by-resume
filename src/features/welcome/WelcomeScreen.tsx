import { useState } from 'react';
import { Button, Icon } from '../../components';
import { Logo } from '../../components/Logo';
import { cn } from '../../utils/cn';
import { isValidEmail } from '../../utils/email';
import './WelcomeScreen.css';

interface WelcomeScreenProps {
  onContinue: () => void;
  onCreateAccount: (email: string) => void;
  onLogin: () => void;
}

export function WelcomeScreen({ onContinue, onCreateAccount, onLogin }: WelcomeScreenProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
    if (error) {
      setError('');
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = email.trim();
    if (trimmed === '') {
      setError('Please enter your email address to continue.');
      return;
    } else if (!isValidEmail(trimmed)) {
      setError('Please enter a valid email address.');
      return;
    }
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

          <form className="welcome__form" onSubmit={handleSubmit} noValidate>
            <label className="sr-only" htmlFor="welcome-email">
              Email address
            </label>
            <input
              id="welcome-email"
              type="email"
              className={cn('welcome__email', error && 'welcome__email--error')}
              placeholder="you@email.com"
              value={email}
              onChange={handleChange}
              autoComplete="email"
              aria-invalid={error !== ''}
              aria-describedby={error ? 'welcome-email-error' : undefined}
            />
            {error && (
              <p className="welcome__error" id="welcome-email-error" role="alert">
                {error}
              </p>
            )}
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
