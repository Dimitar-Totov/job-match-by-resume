import { Button, Card, CardHeader, Icon, ProgressBar, ScoreRing } from '../../components';
import { useNav } from '../../hooks/useNav';
import { scoreTone } from '../../utils/score';
import { cn } from '../../utils/cn';
import {
  BASE_SCORE,
  checklist,
  jobs,
  scoreBars,
  skillGapMini,
  stats,
} from '../../services/mockData';
import './DashboardScreen.css';

export function DashboardScreen() {
  const { navigate } = useNav();
  const doneCount = checklist.filter((item) => item.done).length;
  const recentJobs = jobs.slice(0, 4);

  return (
    <div className="page page--xwide">
      <div className="dashboard__hero u-fadeup">
        <div className="page__intro">
          <h2>Good afternoon, Jordan 👋</h2>
          <p>Here&apos;s how your job search is going this week.</p>
        </div>
        <div className="dashboard__heroActions">
          <Button variant="secondary" leadingIcon="add" onClick={() => navigate('addjob')}>
            Add job
          </Button>
          <Button leadingIcon="upload_file" onClick={() => navigate('upload')}>
            Upload resume
          </Button>
        </div>
      </div>

      <div className="dashboard__topGrid">
        <Card padding="lg">
          <CardHeader
            title="Resume score"
            action={
              <button className="linkBtn" type="button" onClick={() => navigate('analysis')}>
                Full analysis
                <Icon name="arrow_forward" size={17} />
              </button>
            }
          />
          <div className="dashboard__scoreRow">
            <div className="dashboard__ringWrap">
              <ScoreRing percent={BASE_SCORE} size={140} label={`Resume score ${BASE_SCORE} out of 100`}>
                <div className="dashboard__ringNum">{BASE_SCORE}</div>
                <div className="dashboard__ringSub">/ 100</div>
              </ScoreRing>
              <span className="dashboard__delta">
                <Icon name="trending_up" size={14} />
                +14
              </span>
            </div>
            <div className="dashboard__bars">
              {scoreBars.map((bar) => (
                <div key={bar.label}>
                  <div className="dashboard__barHead">
                    <span>{bar.label}</span>
                    <span>{bar.value}</span>
                  </div>
                  <ProgressBar value={bar.value} tone={bar.tone} label={`${bar.label} ${bar.value}%`} />
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card padding="lg" className="dashboard__checklist">
          <div className="dashboard__checkHead">
            <span className="dashboard__cardTitle">Improvement checklist</span>
            <span className="dashboard__checkCount">
              {doneCount}/{checklist.length}
            </span>
          </div>
          <ProgressBar
            value={(doneCount / checklist.length) * 100}
            className="dashboard__checkBar"
            label={`${doneCount} of ${checklist.length} improvements done`}
          />
          <ul className="dashboard__checkList">
            {checklist.map((item) => (
              <li key={item.text} className={cn('dashboard__checkItem', item.done && 'is-done')}>
                <Icon
                  name={item.done ? 'check_circle' : 'radio_button_unchecked'}
                  size={21}
                  filled={item.done}
                  color={item.done ? 'var(--green)' : 'var(--ink-3)'}
                />
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
          <Button
            variant="soft"
            fullWidth
            leadingIcon="insights"
            onClick={() => navigate('analysis')}
          >
            See what to improve
          </Button>
        </Card>
      </div>

      <div className="dashboard__stats">
        {stats.map((stat) => (
          <Card key={stat.label} padding="sm" elevation="sm">
            <div className="dashboard__statHead">
              <span className="dashboard__statIcon">
                <Icon name={stat.icon} size={21} />
              </span>
              <Icon name="trending_up" size={15} color="var(--green-ink)" />
            </div>
            <div className="dashboard__statValue">{stat.value}</div>
            <div className="dashboard__statLabel">{stat.label}</div>
            <div className="dashboard__statDelta">{stat.delta}</div>
          </Card>
        ))}
      </div>

      <div className="dashboard__topGrid">
        <Card>
          <CardHeader
            title="Recent job matches"
            action={
              <button className="linkBtn" type="button" onClick={() => navigate('tracker')}>
                View tracker
                <Icon name="arrow_forward" size={17} />
              </button>
            }
          />
          <div className="dashboard__jobs">
            {recentJobs.map((job) => (
              <button
                key={job.id}
                type="button"
                className="dashboard__job"
                onClick={() => navigate('match')}
              >
                <span className="dashboard__jobMark" style={{ background: job.color }}>
                  {job.mark}
                </span>
                <span className="dashboard__jobBody">
                  <span className="dashboard__jobTitle">{job.title}</span>
                  <span className="dashboard__jobMeta">
                    {job.company} · {job.location}
                  </span>
                </span>
                <span className={cn('scorePill', `scorePill--${scoreTone(job.score)}`)}>
                  {job.score}%
                </span>
                <Icon name="chevron_right" size={20} color="var(--ink-3)" />
              </button>
            ))}
          </div>
        </Card>

        <Card className="dashboard__gaps">
          <CardHeader
            title="Top skill gaps"
            action={
              <button className="linkBtn" type="button" onClick={() => navigate('skills')}>
                See all
              </button>
            }
          />
          <div className="dashboard__gapList">
            {skillGapMini.map((gap) => (
              <div key={gap.skill}>
                <div className="dashboard__gapHead">
                  <span>{gap.skill}</span>
                  <span className="dashboard__gapFreq">in {gap.freq} jobs</span>
                </div>
                <ProgressBar value={gap.pct} tone="amber" height={7} label={`${gap.skill} in ${gap.freq} jobs`} />
              </div>
            ))}
          </div>
          <Button
            variant="secondary"
            fullWidth
            leadingIcon="trending_up"
            onClick={() => navigate('skills')}
          >
            Build learning path
          </Button>
        </Card>
      </div>
    </div>
  );
}
