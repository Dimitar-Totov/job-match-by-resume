import { Button, Card, Icon } from '../../components';
import { cn } from '../../utils/cn';
import { scoreTone } from '../../utils/score';
import { versionScores, versions } from '../../services/mockData';
import './VersionsScreen.css';

const CHART_LABELS = ['Jun 28', 'Jul 3', 'Jul 8', 'Jul 12'];

function buildTrend(scores: number[]) {
  const min = 62;
  const max = 90;
  const step = 268 / (scores.length - 1);
  const points = scores.map((score, index) => ({
    x: 16 + index * step,
    y: 78 - ((score - min) / (max - min)) * 62,
  }));
  const line = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const lastX = (16 + (scores.length - 1) * step).toFixed(1);
  const area = `16,90 ${line} ${lastX},90`;
  return { points, line, area };
}

export function VersionsScreen() {
  const { points, line, area } = buildTrend(versionScores);

  return (
    <div className="page page--md u-fadeup">
      <Card padding="lg">
        <div className="versions__chartHead">
          <span className="versions__cardTitle">Score over time</span>
          <span className="versions__trendUp">
            <Icon name="trending_up" size={18} />
            +18 since first upload
          </span>
        </div>
        <svg viewBox="0 0 300 100" className="versions__chart" role="img" aria-label="Resume score trend over time, improving from 68 to 86">
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--accent)" stopOpacity="0.22" />
              <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points={area} fill="url(#trendFill)" />
          <polyline
            points={line}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {points.map((point, index) => (
            <circle
              key={index}
              cx={point.x.toFixed(1)}
              cy={point.y.toFixed(1)}
              r="4"
              fill="var(--accent)"
              stroke="#fff"
              strokeWidth="2"
            />
          ))}
        </svg>
        <div className="versions__chartLabels">
          {CHART_LABELS.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
      </Card>

      <Card padding="sm" elevation="md" className="versions__list">
        {versions.map((version) => (
          <div key={version.tag} className="versions__row">
            <span className="versions__tag">{version.tag}</span>
            <div className="versions__meta">
              <div className="versions__nameRow">
                <span className="versions__name">{version.name}</span>
                {version.current && <span className="versions__current">Current</span>}
              </div>
              <div className="versions__note">
                {version.note} · {version.date}
              </div>
            </div>
            <span className={cn('scorePill', `scorePill--${scoreTone(version.score)}`)}>
              {version.score}
            </span>
            <Button variant="secondary" size="sm">
              Compare
            </Button>
            <Button variant="secondary" size="sm">
              Restore
            </Button>
          </div>
        ))}
      </Card>
    </div>
  );
}
