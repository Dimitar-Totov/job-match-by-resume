import { Button, Card, Icon } from '../../components';
import { useAuth } from '../../hooks/useAuth';
import { useNav } from '../../hooks/useNav';
import { useSuggestions } from '../../hooks/useSuggestions';
import { cn } from '../../utils/cn';

export function SuggestionsScreen() {
  const { navigate } = useNav();
  const { user } = useAuth();
  const { status, suggestions, baseScore, error, setState, regenerate } = useSuggestions(user?.id);

  if (status === 'idle' || status === 'loading' || status === 'generating') {
    const generating = status === 'generating';
    return (
      <div className="page page--md u-fadein">
        <Card padding="lg" className="suggest__state">
          <Icon name="progress_activity" size={34} spin color="var(--accent)" />
          <div className="suggest__stateTitle">
            {generating ? 'Writing suggestions with AI…' : 'Loading your suggestions…'}
          </div>
          {generating && (
            <div className="suggest__stateText">
              We&apos;re rewriting your weakest resume lines to be sharper and more quantified. This
              can take up to a minute.
            </div>
          )}
        </Card>
      </div>
    );
  }

  if (status === 'empty') {
    return (
      <div className="page page--md u-fadein">
        <Card padding="lg" className="suggest__state">
          <Icon name="description" size={34} color="var(--amber)" />
          <div className="suggest__stateTitle">No resume to improve yet</div>
          <div className="suggest__stateText">
            Upload and parse a resume first, then come back here for AI rewrite suggestions.
          </div>
          <Button leadingIcon="upload_file" onClick={() => navigate('upload')}>
            Upload a resume
          </Button>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="page page--md u-fadein">
        <Card padding="lg" className="suggest__state">
          <Icon name="error" size={34} color="var(--red)" />
          <div className="suggest__stateTitle">We couldn&apos;t generate suggestions</div>
          <div className="suggest__stateText">
            {error ?? 'Something went wrong while writing your suggestions.'}
          </div>
          <Button leadingIcon="refresh" onClick={regenerate}>
            Try again
          </Button>
        </Card>
      </div>
    );
  }

  const accepted = suggestions.filter((s) => s.state === 'accepted').length;
  const rejected = suggestions.filter((s) => s.state === 'rejected').length;
  const pending = suggestions.length - accepted - rejected;
  const projectedScore = baseScore == null ? null : Math.min(100, baseScore + accepted * 3);

  if (suggestions.length === 0) {
    return (
      <div className="page page--md u-fadein">
        <Card padding="lg" className="suggest__state">
          <Icon name="task_alt" size={34} color="var(--green)" />
          <div className="suggest__stateTitle">No rewrites needed right now</div>
          <div className="suggest__stateText">
            The AI didn&apos;t find lines worth rewriting — your resume already reads cleanly.
          </div>
          <Button variant="secondary" leadingIcon="refresh" onClick={regenerate}>
            Regenerate
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="page page--md u-fadeup">
      <div className="suggest__bar">
        <span className="suggest__barIcon">
          <Icon name="auto_awesome" size={24} color="var(--accent)" />
        </span>
        <div className="suggest__barText">
          <div className="suggest__barTitle">AI improvement suggestions</div>
          <div className="suggest__barSub">
            {accepted} accepted · {pending} to review
          </div>
        </div>
        {projectedScore != null && (
          <div className="suggest__scoreChip">
            <span className="suggest__scoreFrom">{baseScore}</span>
            <Icon name="trending_flat" size={18} color="var(--green)" />
            <span className="suggest__scoreTo">{projectedScore}</span>
          </div>
        )}
        <Button leadingIcon="refresh" onClick={regenerate}>
          Regenerate
        </Button>
      </div>

      {error && <div className="suggest__saveError">{error}</div>}

      <div className="suggest__list">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className={cn('suggest__card', `suggest__card--${suggestion.state}`)}
          >
            <div className="suggest__cardHead">
              <span className="suggest__section">{suggestion.section}</span>
              {suggestion.tags.length > 0 && (
                <span className="suggest__tags">{suggestion.tags.join('  ·  ')}</span>
              )}
            </div>
            <div className="suggest__diff">
              <div className="suggest__before">
                <div className="suggest__diffLabel">Before</div>
                <div>{suggestion.before}</div>
              </div>
              <div className="suggest__after">
                <div className="suggest__diffLabel">AI suggestion</div>
                <div>{suggestion.after}</div>
              </div>
            </div>
            <div className="suggest__actions">
              {suggestion.state === 'pending' && (
                <>
                  <button
                    type="button"
                    className="suggest__reject"
                    onClick={() => setState(suggestion.id, 'rejected')}
                  >
                    <Icon name="close" size={18} />
                    Reject
                  </button>
                  <Button
                    size="sm"
                    leadingIcon="check"
                    onClick={() => setState(suggestion.id, 'accepted')}
                  >
                    Accept rewrite
                  </Button>
                </>
              )}
              {suggestion.state === 'accepted' && (
                <>
                  <span className="suggest__accepted">
                    <Icon name="check_circle" size={19} filled />
                    Accepted
                  </span>
                  <button
                    type="button"
                    className="suggest__undo"
                    onClick={() => setState(suggestion.id, 'pending')}
                  >
                    Undo
                  </button>
                </>
              )}
              {suggestion.state === 'rejected' && (
                <>
                  <span className="suggest__dismissed">
                    <Icon name="do_not_disturb_on" size={19} />
                    Dismissed
                  </span>
                  <button
                    type="button"
                    className="suggest__undo"
                    onClick={() => setState(suggestion.id, 'pending')}
                  >
                    Undo
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
