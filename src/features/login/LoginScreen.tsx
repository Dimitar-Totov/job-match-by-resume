import { useState } from 'react';
import { Button, TextField } from '../../components';
import { Logo } from '../../components/Logo';
import './LoginScreen.css';

interface LoginScreenProps {
  onSubmit: (data: { email: string; password: string }) => void;
  isSubmitting: boolean;
  error: string | null;
}

export function LoginScreen({ onSubmit, isSubmitting, error }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const canSubmit = email.trim() !== '' && password !== '';

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit || isSubmitting) {
      return;
    }
    onSubmit({ email: email.trim(), password });
  };

  return (
    <div className="login">
      <header className="login__top">
        <div className="login__brand">
          <Logo size="lg" />
        </div>
      </header>

      <div className="login__body">
        <section className="login__step">
          <h2 className="login__title">Welcome back</h2>
          <p className="login__lede">Log in to keep tracking your applications.</p>

          <form className="login__form" onSubmit={handleSubmit} noValidate>
            <TextField
              label="Email"
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="you@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <TextField
              label="Password"
              id="login-password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />

            {error && (
              <p className="login__error" role="alert">
                {error}
              </p>
            )}

            <div className="login__actions">
              <Button
                type="submit"
                trailingIcon="arrow_forward"
                fullWidth
                disabled={!canSubmit || isSubmitting}
              >
                Log in
              </Button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
