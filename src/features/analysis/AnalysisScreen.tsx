import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Badge, Button, Card, Icon, ScoreRing } from '../../components';
import { useAuth } from '../../hooks/useAuth';
import { useNav } from '../../hooks/useNav';
import { useResumeAnalysis } from '../../hooks/useResumeAnalysis';
import { cn } from '../../utils/cn';
import { wantsRegenerate } from '../../utils/navState';
import type { ScoreLevel } from '../../types';
import './AnalysisScreen.css';

const LEVEL_COLOR: Record<ScoreLevel, string> = {
  good: 'var(--green)',
  warn: 'var(--amber)',
  bad: 'var(--red)',
};
const LEVEL_ICON: Record<ScoreLevel, string> = {
  good: 'check_circle',
  warn: 'error',
  bad: 'cancel',
};

// The summary verdict badge — tone + icon derived from the analysis's tone.
const SUMMARY_BADGE: Record<ScoreLevel, { tone: 'green' | 'amber' | 'red'; icon: string }> = {
  good: { tone: 'green', icon: 'thumb_up' },
  warn: { tone: 'amber', icon: 'trending_up' },
  bad: { tone: 'red', icon: 'priority_high' },
};

// Quick wins carry only text from the model; icons are assigned client-side (by
// index) so the UI never renders a font glyph the model invented.
const WIN_ICONS = ['bolt', 'edit', 'workspace_premium', 'add_task', 'auto_fix_high'];

export function AnalysisScreen() {
  const { navigate } = useNav();
  const { user } = useAuth();
  const location = useLocation();
  const regenerateOnMount = wantsRegenerate(location.state);
  const { status, analysis, error, reanalyze } = useResumeAnalysis(user?.id, regenerateOnMount);

  // Clear the one-shot intent from history so a refresh/back doesn't re-analyze.
  // The hook already captured it in a ref, so this replace doesn't re-run it.
  useEffect(() => {
    if (regenerateOnMount) navigate('analysis', { replace: true });
  }, [regenerateOnMount, navigate]);

  if (status === 'idle' || status === 'loading' || status === 'analyzing') {
    const analyzing = status === 'analyzing';
    return (
      <div className="page page--md u-fadein">
        <Card padding="lg" className="analysis__state">
          <Icon name="progress_activity" size={34} spin color="var(--accent)" />
          <div className="analysis__stateTitle">
            {analyzing ? 'Analyzing your resume with AI…' : 'Loading your analysis…'}
          </div>
          {analyzing && (
            <div className="analysis__stateText">
              We&apos;re scoring your resume, checking ATS compatibility, and finding quick wins. This
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
        <Card padding="lg" className="analysis__state">
          <Icon name="description" size={34} color="var(--amber)" />
          <div className="analysis__stateTitle">No resume to analyze yet</div>
          <div className="analysis__stateText">
            Upload and parse a resume first, then come back here to see its full analysis.
          </div>
          <Button leadingIcon="upload_file" onClick={() => navigate('upload')}>
            Upload a resume
          </Button>
        </Card>
      </div>
    );
  }

  if (status === 'error' || !analysis) {
    return (
      <div className="page page--md u-fadein">
        <Card padding="lg" className="analysis__state">
          <Icon name="error" size={34} color="var(--red)" />
          <div className="analysis__stateTitle">We couldn&apos;t analyze your resume</div>
          <div className="analysis__stateText">
            {error ?? 'Something went wrong while analyzing your resume.'}
          </div>
          <Button leadingIcon="refresh" onClick={reanalyze}>
            Try again
          </Button>
        </Card>
      </div>
    );
  }

  const { overallScore, summary, ats, sections, writingIssues, quickWins, projectedScore } = analysis;
  const badge = SUMMARY_BADGE[summary.tone];
  const atsPass = ats.checks.filter((check) => check.pass).length;

  return (
    <div className="page page--wide">
      <div className="analysis__top">
        <Card padding="lg" className="analysis__summary u-fadeup">
          <ScoreRing
            percent={overallScore}
            size={150}
            strokeWidth={14}
            label={`Resume score ${overallScore} out of 100`}
          >
            <div className="analysis__ringNum">{overallScore}</div>
            <div className="analysis__ringSub">/ 100</div>
          </ScoreRing>
          <div className="analysis__summaryBody">
            <Badge tone={badge.tone} icon={badge.icon}>
              {summary.label}
            </Badge>
            <h2>{summary.headline}</h2>
            <p>{summary.body}</p>
            <div className="analysis__summaryActions">
              <Button variant="secondary" leadingIcon="refresh" onClick={reanalyze}>
                Re-analyze
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          <div className="analysis__atsHead">
            <div>
              <div className="analysis__cardTitle">ATS compatibility</div>
              <div className="analysis__atsSub">
                {atsPass} of {ats.checks.length} checks passed
              </div>
            </div>
            <div className="analysis__atsScore">{ats.score}</div>
          </div>
          <ul className="analysis__atsList">
            {ats.checks.map((check) => (
              <li key={check.label}>
                <Icon
                  name={check.pass ? 'check_circle' : 'cancel'}
                  size={19}
                  filled
                  color={check.pass ? 'var(--green)' : 'var(--red)'}
                />
                <span>{check.label}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card padding="lg">
        <div className="analysis__cardTitle analysis__feedbackTitle">Section-by-section feedback</div>
        <div className="analysis__sections">
          {sections.map((section) => (
            <div key={section.name} className="analysis__row">
              <Icon
                name={LEVEL_ICON[section.level]}
                size={24}
                filled
                color={LEVEL_COLOR[section.level]}
              />
              <div className="analysis__rowName">{section.name}</div>
              <div className="analysis__rowNote">{section.note}</div>
              <div className="analysis__rowBar">
                <span style={{ width: `${section.score}%`, background: LEVEL_COLOR[section.level] }} />
              </div>
              <span className="analysis__rowScore">{section.score === 0 ? '—' : section.score}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="analysis__bottom">
        <Card>
          <div className="sectionHeading">
            <Icon name="spellcheck" size={21} color="var(--amber)" />
            <span className="sectionHeading__title">Grammar &amp; wording</span>
            <span className="analysis__issueCount">
              {writingIssues.length} {writingIssues.length === 1 ? 'issue' : 'issues'}
            </span>
          </div>
          {writingIssues.length === 0 ? (
            <p className="analysis__winsLede">
              No grammar or wording issues found — your writing reads cleanly.
            </p>
          ) : (
            <div className="analysis__issues">
              {writingIssues.map((issue) => (
                <div key={`${issue.type}-${issue.text}`} className="analysis__issue">
                  <span
                    className={cn(
                      'analysis__issueType',
                      `tone-${issue.severity === 'bad' ? 'red' : 'amber'}`,
                    )}
                  >
                    {issue.type}
                  </span>
                  <div className="analysis__issueText">{issue.text}</div>
                  <div className="analysis__issueFix">
                    <Icon name="arrow_forward" size={15} />
                    {issue.fix}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="analysis__wins">
          <div className="sectionHeading">
            <Icon name="rocket_launch" size={22} color="var(--accent)" />
            <span className="sectionHeading__title">Your quick wins</span>
          </div>
          {quickWins.length === 0 ? (
            <p className="analysis__winsLede">
              Your resume is in great shape — no quick wins needed right now.
            </p>
          ) : (
            <>
              <p className="analysis__winsLede">
                We found {quickWins.length} {quickWins.length === 1 ? 'change' : 'changes'} that could
                raise your score to <b>{projectedScore}</b>.
              </p>
              <div className="analysis__winList">
                {quickWins.map((win, index) => (
                  <div key={win.label} className="analysis__win">
                    <Icon name={WIN_ICONS[index % WIN_ICONS.length]} size={20} color="var(--accent)" />
                    <span>{win.label}</span>
                    <span className="analysis__winGain">{win.gain}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
