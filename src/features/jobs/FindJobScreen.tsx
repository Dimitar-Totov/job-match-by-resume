import { useEffect, useRef, useState } from 'react';
import { Button, Card, Icon, TextField } from '../../components';
import { useAuth } from '../../hooks/useAuth';
import { useNav } from '../../hooks/useNav';
import { useProfile } from '../../hooks/useProfile';
import { JOB_SITES, searchJobs } from '../../services/jobSearchService';
import type { FoundJob } from '../../types';
import type { MatchLocationState } from './MatchScreen';
import './jobs.css';

type FindStatus = 'idle' | 'searching' | 'success' | 'error';

export function FindJobScreen() {
  const { navigate } = useNav();
  const { user } = useAuth();
  const { profile } = useProfile(user?.id);

  const [siteId, setSiteId] = useState(JOB_SITES[0].id);
  const [query, setQuery] = useState('');
  const [queryTouched, setQueryTouched] = useState(false);
  const [status, setStatus] = useState<FindStatus>('idle');
  const [results, setResults] = useState<FoundJob[]>([]);
  const requestIdRef = useRef(0);

  // Prefill from the user's first target role once their profile loads, but
  // never overwrite anything they've already typed — same pattern as
  // SettingsScreen syncing its form only while not mid-edit.
  useEffect(() => {
    const targetRole = profile?.target_roles?.[0];
    if (!queryTouched && targetRole) {
      setQuery(targetRole);
    }
  }, [profile, queryTouched]);

  // Guard against a stale response landing after the component unmounts (e.g.
  // navigating away mid-search) — same request-id pattern as useProfile/useResume.
  useEffect(() => () => {
    requestIdRef.current += 1;
  }, []);

  const selectedSite = JOB_SITES.find((site) => site.id === siteId) ?? JOB_SITES[0];

  const handleFind = () => {
    const requestId = ++requestIdRef.current;
    setStatus('searching');
    searchJobs(siteId, query)
      .then((found) => {
        if (requestIdRef.current !== requestId) return;
        setResults(found);
        setStatus('success');
      })
      .catch(() => {
        if (requestIdRef.current !== requestId) return;
        setStatus('error');
      });
  };

  const handleViewResults = () => {
    navigate('match', {
      state: { jobs: results, query, site: siteId } satisfies MatchLocationState,
    });
  };

  const isSearching = status === 'searching';

  return (
    <div className="page page--md u-fadeup">
      <Card padding="lg" className="findjob__card">
        <div className="findjob__intro">
          <span className="findjob__introIcon">
            <Icon name="travel_explore" size={26} color="var(--accent)" />
          </span>
          <div>
            <div className="findjob__title">Find your next job match</div>
            <p className="findjob__lede">
              Pick a job site and a role — we&apos;ll run a search and show how well the openings
              match your resume.
            </p>
          </div>
        </div>

        <div className="findjob__form">
          <div className="findjob__field">
            <label className="findjob__label" htmlFor="findjob-site">
              Job site
            </label>
            <div className="findjob__selectRow">
              <span className="findjob__siteIcon">
                <Icon name={selectedSite.icon} size={19} color="var(--accent)" />
              </span>
              <select
                id="findjob-site"
                className="findjob__select"
                value={siteId}
                disabled={isSearching}
                onChange={(event) => {
                  setSiteId(event.target.value);
                  setStatus('idle');
                }}
              >
                {JOB_SITES.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <TextField
            label="Role or keywords"
            placeholder="e.g. Product Designer"
            value={query}
            disabled={isSearching}
            onChange={(event) => {
              setQuery(event.target.value);
              setQueryTouched(true);
              setStatus('idle');
            }}
          />
        </div>

        <Button
          fullWidth
          size="lg"
          className="findjob__submit"
          disabled={isSearching}
          onClick={handleFind}
        >
          {isSearching ? (
            <>
              <Icon name="progress_activity" size={20} spin />
              Finding jobs…
            </>
          ) : (
            <>
              <Icon name="travel_explore" size={20} />
              Find jobs
            </>
          )}
        </Button>

        {status === 'success' && (
          <div className="findjob__result u-fadein">
            <Icon name="check_circle" size={22} filled color="var(--green)" />
            <div className="findjob__resultText">
              <div className="findjob__resultTitle">
                Found {results.length} {results.length === 1 ? 'job' : 'jobs'} on {selectedSite.label}
              </div>
              <div className="findjob__resultSub">Ready to see how each one matches your resume.</div>
            </div>
            <Button size="sm" trailingIcon="arrow_forward" onClick={handleViewResults}>
              View match results
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div className="findjob__error u-fadein" role="alert">
            <Icon name="error" size={22} color="var(--red)" />
            <div className="findjob__resultText">
              <div className="findjob__resultTitle">Something went wrong</div>
              <div className="findjob__resultSub">We couldn&apos;t complete that search. Please try again.</div>
            </div>
            <Button size="sm" variant="secondary" leadingIcon="refresh" onClick={handleFind}>
              Retry
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
