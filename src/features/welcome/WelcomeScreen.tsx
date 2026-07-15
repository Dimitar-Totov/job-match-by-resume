import { useState } from 'react';
import { Button, Icon, PillTag, ProgressBar, ScoreRing } from '../../components';
import { Logo } from '../../components/Logo';
import './WelcomeScreen.css';

interface WelcomeScreenProps {
  onContinue: () => void;
}

export function WelcomeScreen({ onContinue }: WelcomeScreenProps) {
  const [email, setEmail] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onContinue();
  };

  return (
    <div className="welcome">
      <div className="welcome__panel">
        <Logo size="lg" />
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
            <button type="button" className="welcome__link" onClick={onContinue}>
              Log in
            </button>
          </p>
        </div>
        <p className="welcome__terms">By continuing you agree to our Terms &amp; Privacy Policy.</p>
      </div>

      <div className="welcome__art" aria-hidden="true">
        <div className="welcome__blob welcome__blob--1" />
        <div className="welcome__blob welcome__blob--2" />

        <div className="welcome__float welcome__float--score">
          <div className="welcome__floatLabel">Resume score</div>
          <div className="welcome__scoreRow">
            <ScoreRing percent={82} size={104} strokeWidth={10} label="Resume score 82 out of 100">
              <div className="welcome__scoreNum">82</div>
            </ScoreRing>
            <div className="welcome__legend">
              <span className="welcome__legendItem">
                <span className="welcome__dot welcome__dot--green" />
                ATS-ready
              </span>
              <span className="welcome__legendItem welcome__legendItem--muted">
                <span className="welcome__dot welcome__dot--accent" />
                Strong content
              </span>
              <span className="welcome__legendItem welcome__legendItem--muted">
                <span className="welcome__dot welcome__dot--amber" />5 quick wins
              </span>
            </div>
          </div>
        </div>

        <div className="welcome__float welcome__float--job">
          <div className="welcome__jobHead">
            <span className="welcome__jobMark">St</span>
            <div>
              <div className="welcome__jobTitle">Product Designer</div>
              <div className="welcome__jobMeta">Stripe · Remote</div>
            </div>
          </div>
          <div className="welcome__matchRow">
            <span>Match</span>
            <span className="welcome__matchPct">92%</span>
          </div>
          <ProgressBar value={92} tone="gradient" height={8} label="Match 92%" />
        </div>

        <div className="welcome__float welcome__float--skills">
          <div className="welcome__skillsTitle">Skills matched</div>
          <div className="welcome__skills">
            <PillTag tone="green">Figma</PillTag>
            <PillTag tone="green">Prototyping</PillTag>
            <PillTag tone="green">Research</PillTag>
            <PillTag tone="amber">+ Framer</PillTag>
          </div>
        </div>
      </div>
    </div>
  );
}
