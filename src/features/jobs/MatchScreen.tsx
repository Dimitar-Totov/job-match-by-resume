import { useLocation } from 'react-router-dom';
import { Button, Card, Icon } from '../../components';
import { useNav } from '../../hooks/useNav';
import { JOB_SITES } from '../../services/jobSearchService';
import { cn } from '../../utils/cn';
import { scoreTone } from '../../utils/score';
import type { FoundJob } from '../../types';
import './jobs.css';

export interface MatchLocationState {
  jobs: FoundJob[];
  query: string;
  site: string;
}

function isFoundJob(value: unknown): value is FoundJob {
  if (typeof value !== 'object' || value === null) return false;
  const job = value as Record<string, unknown>;
  return (
    typeof job.id === 'string' &&
    typeof job.title === 'string' &&
    typeof job.company === 'string' &&
    typeof job.mark === 'string' &&
    typeof job.color === 'string' &&
    typeof job.location === 'string' &&
    typeof job.score === 'number' &&
    typeof job.site === 'string' &&
    typeof job.siteLabel === 'string' &&
    typeof job.url === 'string'
  );
}

function isMatchLocationState(state: unknown): state is MatchLocationState {
  if (typeof state !== 'object' || state === null) return false;
  const candidate = state as { jobs?: unknown; query?: unknown; site?: unknown };
  return (
    Array.isArray(candidate.jobs) &&
    candidate.jobs.every(isFoundJob) &&
    typeof candidate.query === 'string' &&
    typeof candidate.site === 'string'
  );
}

function siteIcon(siteId: string): string {
  return JOB_SITES.find((site) => site.id === siteId)?.icon ?? 'public';
}

export function MatchScreen() {
  const { navigate } = useNav();
  const location = useLocation();
  const matchState = isMatchLocationState(location.state) ? location.state : null;

  if (!matchState || matchState.jobs.length === 0) {
    return (
      <div className="page page--md u-fadein">
        <Card padding="lg" className="match__empty">
          <Icon name="travel_explore" size={34} color="var(--amber)" />
          <div className="match__emptyTitle">No search results yet</div>
          <div className="match__emptyText">
            Run a job search first and we&apos;ll show every matching opening here.
          </div>
          <Button leadingIcon="travel_explore" onClick={() => navigate('findjob')}>
            Find a job
          </Button>
        </Card>
      </div>
    );
  }

  const { jobs: results, query } = matchState;
  const siteLabel = results[0]?.siteLabel ?? '';

  return (
    <div className="page page--wide">
      <div className="match__header u-fadeup">
        <div>
          <div className="match__headerTitle">Job matches</div>
          <p className="match__headerLede">
            Found <strong>{results.length}</strong> {results.length === 1 ? 'job' : 'jobs'} for{' '}
            <strong>{query || 'your target role'}</strong> on {siteLabel}.
          </p>
        </div>
        <Button variant="secondary" leadingIcon="travel_explore" onClick={() => navigate('findjob')}>
          New search
        </Button>
      </div>

      <div className="match__list">
        {results.map((job, index) => (
          <Card
            key={job.id}
            padding="lg"
            className="match__card u-fadeup"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <span className="match__cardMark" style={{ background: job.color }}>
              {job.mark}
            </span>
            <div className="match__cardBody">
              <div className="match__cardTop">
                <div>
                  <div className="match__cardJobTitle">{job.title}</div>
                  <div className="match__cardMeta">
                    {job.company} · {job.location}
                  </div>
                </div>
                <span className={cn('scorePill', `scorePill--${scoreTone(job.score)}`)}>
                  {job.score}% match
                </span>
              </div>
              <div className="match__cardFoot">
                <span className="match__cardSite">
                  <Icon name={siteIcon(job.site)} size={16} />
                  {job.siteLabel}
                </span>
                <a className="match__cardLink" href={job.url} target="_blank" rel="noopener noreferrer">
                  View job
                  <Icon name="open_in_new" size={16} />
                </a>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
