import { useEffect, useState } from 'react';
import { Button, Chip } from '../../components';
import { Logo } from '../../components/Logo';
import {
  onboardingExpLevels,
  onboardingFields,
  onboardingIndustries,
  onboardingRoles,
} from '../../services/mockData';
import './OnboardingScreen.css';

interface OnboardingScreenProps {
  onComplete: () => void;
  isSubmitting?: boolean;
  error?: string | null;
}

interface OnboardingHistoryState {
  screen: 'onboarding';
  onboardingStep?: number;
}

const GRAD_YEARS = ['2027', '2026', '2025', '2024', '2023', '2022', '2020 or earlier'];
const TOTAL_STEPS = 3;

export function OnboardingScreen({
  onComplete,
  isSubmitting = false,
  error = null,
}: OnboardingScreenProps) {
  const [step, setStep] = useState(0);
  const [field, setField] = useState('Computer Science');
  const [gradYear, setGradYear] = useState('2024');
  const [roles, setRoles] = useState<string[]>(['Product Designer', 'UX Designer']);
  const [industries, setIndustries] = useState<string[]>(['Technology']);
  const [expLevel, setExpLevel] = useState('Mid-level');

  // The wizard's own steps are also history entries: stepping forward
  // pushes {screen:'onboarding', onboardingStep}, so the mouse/keyboard back
  // button walks back through steps before exiting to whatever screen was
  // active before onboarding. NavProvider's own popstate handler reads
  // `state.screen` and leaves it as 'onboarding' for these entries, so this
  // component stays mounted and only its local step needs to follow along.
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const state = event.state as OnboardingHistoryState | null;
      if (state?.screen === 'onboarding') {
        setStep(state.onboardingStep ?? 0);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const toggle = (list: string[], value: string): string[] =>
    list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

  const handleNext = () => {
    if (step >= TOTAL_STEPS - 1) {
      if (isSubmitting) return;
      onComplete();
      return;
    }
    const nextStep = step + 1;
    window.history.pushState(
      { screen: 'onboarding', onboardingStep: nextStep } satisfies OnboardingHistoryState,
      '',
    );
    setStep(nextStep);
  };

  const progress = ((step + 1) / TOTAL_STEPS) * 100;

  return (
    <div className="onboarding">
      <header className="onboarding__top">
        <Logo size="sm" />
        <button
          type="button"
          className="onboarding__skip"
          onClick={onComplete}
          disabled={isSubmitting}
        >
          Skip for now
        </button>
      </header>

      <div className="onboarding__body">
        <span className="onboarding__stepLabel">
          Step {step + 1} of {TOTAL_STEPS}
        </span>
        <div
          className="onboarding__progress"
          role="progressbar"
          aria-valuenow={step + 1}
          aria-valuemin={1}
          aria-valuemax={TOTAL_STEPS}
        >
          <span style={{ width: `${progress}%` }} />
        </div>

        {step === 0 && (
          <section className="onboarding__step" key="step-0">
            <h2 className="onboarding__title">Let&apos;s get to know you</h2>
            <p className="onboarding__lede">
              This helps us tailor scoring and suggestions to your field.
            </p>

            <h3 className="onboarding__group">Field of study</h3>
            <div className="onboarding__chips">
              {onboardingFields.map((option) => (
                <Chip key={option} selected={field === option} onClick={() => setField(option)}>
                  {option}
                </Chip>
              ))}
            </div>

            <h3 className="onboarding__group">Graduation year</h3>
            <label className="sr-only" htmlFor="grad-year">
              Graduation year
            </label>
            <select
              id="grad-year"
              className="onboarding__select"
              value={gradYear}
              onChange={(event) => setGradYear(event.target.value)}
            >
              {GRAD_YEARS.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </section>
        )}

        {step === 1 && (
          <section className="onboarding__step" key="step-1">
            <h2 className="onboarding__title">What roles are you after?</h2>
            <p className="onboarding__lede">
              Pick a few — we&apos;ll match jobs and score against these.
            </p>
            <div className="onboarding__chips">
              {onboardingRoles.map((option) => (
                <Chip
                  key={option}
                  selected={roles.includes(option)}
                  onClick={() => setRoles((prev) => toggle(prev, option))}
                >
                  {option}
                </Chip>
              ))}
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="onboarding__step" key="step-2">
            <h2 className="onboarding__title">Target industries &amp; level</h2>
            <p className="onboarding__lede">Last one — then your dashboard is ready.</p>

            <h3 className="onboarding__group">Industries</h3>
            <div className="onboarding__chips">
              {onboardingIndustries.map((option) => (
                <Chip
                  key={option}
                  selected={industries.includes(option)}
                  onClick={() => setIndustries((prev) => toggle(prev, option))}
                >
                  {option}
                </Chip>
              ))}
            </div>

            <h3 className="onboarding__group">Experience level</h3>
            <div className="onboarding__chips">
              {onboardingExpLevels.map((option) => (
                <Chip
                  key={option}
                  selected={expLevel === option}
                  onClick={() => setExpLevel(option)}
                >
                  {option}
                </Chip>
              ))}
            </div>
          </section>
        )}

        {error && step >= TOTAL_STEPS - 1 && (
          <p className="onboarding__error" role="alert">
            {error}
          </p>
        )}

        <div className="onboarding__actions">
          <Button
            trailingIcon="arrow_forward"
            fullWidth
            onClick={handleNext}
            disabled={isSubmitting}
          >
            {step >= TOTAL_STEPS - 1
              ? isSubmitting
                ? 'Setting up…'
                : 'Finish setup'
              : 'Continue'}
          </Button>
        </div>
      </div>
    </div>
  );
}
