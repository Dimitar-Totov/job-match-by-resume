import { useState } from 'react';
import { Button, Card, Icon, PillTag, TextField } from '../../components';
import { useNav } from '../../hooks/useNav';
import { cn } from '../../utils/cn';
import './jobs.css';

const SAMPLE_DESCRIPTION = `About the role: We're looking for a Product Designer to own end-to-end design for our payments platform. You'll work closely with PMs and engineers to ship intuitive, accessible experiences.

Requirements: 4+ years in product design, strong Figma & prototyping skills, experience with design systems, a/b testing, and accessibility (WCAG). Bonus: HTML/CSS, motion design.`;

const REQUIREMENTS = ['Figma', 'Prototyping', 'Design systems', 'A/B testing', 'Accessibility'];

export function AddJobScreen() {
  const { navigate } = useNav();
  const [tab, setTab] = useState<'text' | 'url'>('text');
  const [description, setDescription] = useState(SAMPLE_DESCRIPTION);

  return (
    <div className="page page--wide u-fadeup">
      <div className="addjob__grid">
        <Card padding="lg">
          <div className="addjob__title">Add a job</div>
          <p className="addjob__lede">
            Paste a description or drop in a link — we&apos;ll pull out the key details automatically.
          </p>

          <div className="addjob__tabs" role="tablist" aria-label="Job input method">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'text'}
              className={cn('addjob__tab', tab === 'text' && 'is-active')}
              onClick={() => setTab('text')}
            >
              Paste text
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'url'}
              className={cn('addjob__tab', tab === 'url' && 'is-active')}
              onClick={() => setTab('url')}
            >
              From URL
            </button>
          </div>

          {tab === 'text' ? (
            <>
              <label className="addjob__label" htmlFor="jd">
                Job description
              </label>
              <textarea
                id="jd"
                className="addjob__textarea"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </>
          ) : (
            <TextField label="Job posting URL" placeholder="https://…" />
          )}

          <Button variant="soft" fullWidth leadingIcon="auto_awesome">
            Auto-extract details
          </Button>
        </Card>

        <Card padding="lg">
          <div className="addjob__extracted">
            <Icon name="check_circle" size={19} color="var(--green)" />
            <span>Extracted from description</span>
          </div>
          <div className="addjob__company">
            <span className="addjob__mark">St</span>
            <div>
              <div className="addjob__companyTitle">Product Designer</div>
              <div className="addjob__companyMeta">Stripe · Remote (US)</div>
            </div>
          </div>

          <div className="addjob__fields">
            <TextField label="Company" defaultValue="Stripe" />
            <div className="addjob__row2">
              <TextField label="Job title" defaultValue="Product Designer" />
              <TextField label="Deadline" type="date" defaultValue="2026-07-20" />
            </div>
            <div>
              <div className="addjob__reqLabel">Key requirements</div>
              <div className="addjob__reqs">
                {REQUIREMENTS.map((req) => (
                  <PillTag key={req} tone="neutral">
                    {req}
                  </PillTag>
                ))}
              </div>
            </div>
          </div>

          <Button
            fullWidth
            leadingIcon="track_changes"
            className="addjob__submit"
            onClick={() => navigate('match')}
          >
            Save &amp; analyze match
          </Button>
        </Card>
      </div>
    </div>
  );
}
