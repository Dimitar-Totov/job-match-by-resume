import { useState } from 'react';
import { Button, TextField } from '../../components';
import { Logo } from '../../components/Logo';
import './RegisterScreen.css';

interface RegisterScreenProps {
  onSubmit: (data: { username: string; password: string }) => void;
}

export function RegisterScreen({ onSubmit }: RegisterScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [touched, setTouched] = useState(false);

  const allFilled = username.trim() !== '' && password !== '' && repeatPassword !== '';
  const passwordsMatch = password === repeatPassword;
  const canSubmit = allFilled && passwordsMatch;

  const showMismatch = touched && password !== '' && repeatPassword !== '' && !passwordsMatch;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (!canSubmit) {
      return;
    }
    onSubmit({ username: username.trim(), password });
  };

  return (
    <div className="register">
      <header className="register__top">
        <div className="register__brand">
          <Logo size="lg" />
        </div>
      </header>

      <div className="register__body">
        <section className="register__step">
          <h2 className="register__title">Create your account</h2>
          <p className="register__lede">
            A few details and you&apos;re ready to get your resume scored.
          </p>

          <form className="register__form" onSubmit={handleSubmit} noValidate>
            <TextField
              label="Username"
              id="register-username"
              type="text"
              autoComplete="username"
              placeholder="janedoe"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
            <TextField
              label="Password"
              id="register-password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <TextField
              label="Repeat password"
              id="register-repeat-password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={repeatPassword}
              onChange={(event) => setRepeatPassword(event.target.value)}
              onBlur={() => setTouched(true)}
              aria-invalid={showMismatch}
              aria-describedby={showMismatch ? 'register-password-error' : undefined}
            />
            {showMismatch && (
              <p className="register__error" id="register-password-error" role="alert">
                Passwords don&apos;t match.
              </p>
            )}

            <div className="register__actions">
              <Button type="submit" trailingIcon="arrow_forward" fullWidth disabled={!canSubmit}>
                Continue
              </Button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
