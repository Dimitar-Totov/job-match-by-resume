import { Badge, Button, Card, Icon, ScoreRing } from '../../components';
import { useNav } from '../../hooks/useNav';
import { cn } from '../../utils/cn';
import type { ScoreLevel } from '../../types';
import {
  ATS_SCORE,
  BASE_SCORE,
  analysisSections,
  atsChecks,
  writingIssues,
} from '../../services/mockData';
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

const QUICK_WINS = [
  { icon: 'bolt', label: 'Add 5 missing keywords', gain: '+6' },
  { icon: 'edit', label: 'Rewrite 4 weak bullets', gain: '+5' },
  { icon: 'workspace_premium', label: 'Add a certifications section', gain: '+3' },
];

export function AnalysisScreen() {
  const { navigate } = useNav();
  const atsPass = atsChecks.filter((check) => check.pass).length;

  return (
    <div className="page page--wide">
      <div className="analysis__top">
        <Card padding="lg" className="analysis__summary u-fadeup">
          <ScoreRing percent={BASE_SCORE} size={150} strokeWidth={14} label={`Resume score ${BASE_SCORE} out of 100`}>
            <div className="analysis__ringNum">{BASE_SCORE}</div>
            <div className="analysis__ringSub">/ 100</div>
          </ScoreRing>
          <div className="analysis__summaryBody">
            <Badge tone="green" icon="thumb_up">
              Strong resume
            </Badge>
            <h2>You&apos;re in good shape</h2>
            <p>
              Your resume beats 78% of candidates for your target roles. Fix a few quick wins to push
              past 90.
            </p>
            <Button leadingIcon="auto_awesome" onClick={() => navigate('suggestions')}>
              Fix with AI
            </Button>
          </div>
        </Card>

        <Card>
          <div className="analysis__atsHead">
            <div>
              <div className="analysis__cardTitle">ATS compatibility</div>
              <div className="analysis__atsSub">
                {atsPass} of {atsChecks.length} checks passed
              </div>
            </div>
            <div className="analysis__atsScore">{ATS_SCORE}</div>
          </div>
          <ul className="analysis__atsList">
            {atsChecks.map((check) => (
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
          {analysisSections.map((section) => (
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
            <span className="analysis__issueCount">4 issues</span>
          </div>
          <div className="analysis__issues">
            {writingIssues.map((issue) => (
              <div key={issue.text} className="analysis__issue">
                <span className={cn('analysis__issueType', `tone-${issue.severity === 'bad' ? 'red' : 'amber'}`)}>
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
        </Card>

        <Card className="analysis__wins">
          <div className="sectionHeading">
            <Icon name="rocket_launch" size={22} color="var(--accent)" />
            <span className="sectionHeading__title">Your quick wins</span>
          </div>
          <p className="analysis__winsLede">
            We found 5 changes that could raise your score to <b>94</b>. Most take under a minute with
            AI.
          </p>
          <div className="analysis__winList">
            {QUICK_WINS.map((win) => (
              <div key={win.label} className="analysis__win">
                <Icon name={win.icon} size={20} color="var(--accent)" />
                <span>{win.label}</span>
                <span className="analysis__winGain">{win.gain}</span>
              </div>
            ))}
          </div>
          <Button leadingIcon="auto_awesome" fullWidth onClick={() => navigate('suggestions')}>
            See all suggestions
          </Button>
        </Card>
      </div>
    </div>
  );
}
