import { useMemo, useState } from 'react';
import { Button, Icon } from '../../components';
import { useNav } from '../../hooks/useNav';
import { cn } from '../../utils/cn';
import type { SuggestionState } from '../../types';
import { BASE_SCORE, suggestions } from '../../services/mockData';
import './SuggestionsScreen.css';

export function SuggestionsScreen() {
  const { navigate } = useNav();
  const [states, setStates] = useState<Record<number, SuggestionState>>({});

  const setState = (id: number, next: SuggestionState) => {
    setStates((prev) => ({ ...prev, [id]: next }));
  };

  const { accepted, rejected } = useMemo(() => {
    let acc = 0;
    let rej = 0;
    for (const value of Object.values(states)) {
      if (value === 'accepted') acc += 1;
      if (value === 'rejected') rej += 1;
    }
    return { accepted: acc, rejected: rej };
  }, [states]);

  const pending = suggestions.length - accepted - rejected;
  const projectedScore = Math.min(96, BASE_SCORE + accepted * 3);

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
        <div className="suggest__scoreChip">
          <span className="suggest__scoreFrom">{BASE_SCORE}</span>
          <Icon name="trending_flat" size={18} color="var(--green)" />
          <span className="suggest__scoreTo">{projectedScore}</span>
        </div>
        <Button leadingIcon="refresh" onClick={() => navigate('analysis')}>
          Re-score
        </Button>
      </div>

      <div className="suggest__list">
        {suggestions.map((suggestion) => {
          const state = states[suggestion.id] ?? 'pending';
          return (
            <div
              key={suggestion.id}
              className={cn('suggest__card', `suggest__card--${state}`)}
            >
              <div className="suggest__cardHead">
                <span className="suggest__section">{suggestion.section}</span>
                <span className="suggest__tags">{suggestion.tags.join('  ·  ')}</span>
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
                {state === 'pending' && (
                  <>
                    <button
                      type="button"
                      className="suggest__reject"
                      onClick={() => setState(suggestion.id, 'rejected')}
                    >
                      <Icon name="close" size={18} />
                      Reject
                    </button>
                    <Button size="sm" leadingIcon="check" onClick={() => setState(suggestion.id, 'accepted')}>
                      Accept rewrite
                    </Button>
                  </>
                )}
                {state === 'accepted' && (
                  <>
                    <span className="suggest__accepted">
                      <Icon name="check_circle" size={19} filled />
                      Accepted &amp; applied
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
                {state === 'rejected' && (
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
          );
        })}
      </div>
    </div>
  );
}
