import { Button, Card, Icon, PillTag, ScoreRing } from '../../components';
import { useNav } from '../../hooks/useNav';
import {
  keywordGaps,
  matchDimensions,
  matchedSkills,
  missingSkills,
} from '../../services/mockData';
import './jobs.css';

function dimensionTone(pct: number): 'green' | 'accent' | 'amber' {
  if (pct >= 85) return 'green';
  if (pct >= 70) return 'accent';
  return 'amber';
}

const DIMENSION_COLORS: Record<'green' | 'accent' | 'amber', string> = {
  green: 'var(--green)',
  accent: 'var(--accent)',
  amber: 'var(--amber)',
};

export function MatchScreen() {
  const { navigate } = useNav();

  return (
    <div className="page page--wide">
      <Card padding="lg" className="match__summary u-fadeup">
        <ScoreRing percent={84} size={148} strokeWidth={14} label="Job match 84 percent">
          <div className="match__ringNum">84%</div>
          <div className="match__ringSub">match</div>
        </ScoreRing>
        <div className="match__summaryBody">
          <div className="match__company">
            <span className="match__mark">St</span>
            <div>
              <div className="match__companyTitle">Product Designer</div>
              <div className="match__companyMeta">Stripe · Remote (US) · closes Jul 20</div>
            </div>
          </div>
          <p>
            Strong fit. You match most core requirements — closing 3 keyword gaps could push you above
            90%.
          </p>
          <Button leadingIcon="auto_fix_high" onClick={() => navigate('tailor')}>
            Tailor my résumé for this job
          </Button>
        </div>
        <div className="match__dims">
          {matchDimensions.map((dim) => {
            const tone = dimensionTone(dim.pct);
            return (
              <div key={dim.label}>
                <div className="match__dimHead">
                  <span>{dim.label}</span>
                  <span>{dim.pct}%</span>
                </div>
                <div className="match__dimBar">
                  <span style={{ width: `${dim.pct}%`, background: DIMENSION_COLORS[tone] }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="match__skills">
        <Card>
          <div className="sectionHeading">
            <Icon name="verified" size={21} filled color="var(--green)" />
            <span className="sectionHeading__title">Matched skills</span>
            <span className="match__count match__count--green">{matchedSkills.length}</span>
          </div>
          <div className="match__pills">
            {matchedSkills.map((skill) => (
              <PillTag key={skill} tone="green" icon="check">
                {skill}
              </PillTag>
            ))}
          </div>
        </Card>

        <Card>
          <div className="sectionHeading">
            <Icon name="add_circle" size={21} color="var(--amber)" />
            <span className="sectionHeading__title">Missing skills</span>
            <span className="match__count match__count--amber">{missingSkills.length}</span>
          </div>
          <div className="match__pills">
            {missingSkills.map((skill) => (
              <PillTag key={skill} tone="amber" icon="add">
                {skill}
              </PillTag>
            ))}
          </div>
          <p className="match__hint">
            Add these to your résumé (if you have them) or explore courses in your{' '}
            <button type="button" className="linkBtn" onClick={() => navigate('skills')}>
              learning path
            </button>
            .
          </p>
        </Card>
      </div>

      <Card>
        <div className="match__cardTitle">Keyword gap analysis</div>
        <p className="match__cardLede">
          Keywords the job posting uses, and whether they appear in your résumé.
        </p>
        <div className="match__pills">
          {keywordGaps.map((gap) => (
            <PillTag
              key={gap.keyword}
              tone={gap.present ? 'green' : 'red'}
              icon={gap.present ? 'check' : 'add'}
              mono
            >
              {gap.keyword}
            </PillTag>
          ))}
        </div>
      </Card>
    </div>
  );
}
