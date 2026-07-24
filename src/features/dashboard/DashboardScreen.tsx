import { Button, Card, CardHeader, Icon, ProgressBar, ScoreRing } from '../../components';
import { useAuth } from '../../hooks/useAuth';
import { useNav } from '../../hooks/useNav';
import { useProfile } from '../../hooks/useProfile';
import { useResumeAnalysis } from '../../hooks/useResumeAnalysis';
import { scoreTone } from '../../utils/score';
import { cn } from '../../utils/cn';
import { jobs, skillGapMini, stats } from '../../services/mockData';
import './DashboardScreen.css';

function greetingForHour(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function DashboardScreen() {
  const { navigate } = useNav();
  const { user } = useAuth();
  const { profile } = useProfile(user?.id);
  const { status: analysisStatus, analysis, error: analysisError, reanalyze } = useResumeAnalysis(
    user?.id,
  );
  const recentJobs = jobs.slice(0, 4);
  const firstName = (profile?.username || user?.email || '').trim().split(/\s+/)[0];
  const greeting = greetingForHour(new Date().getHours());

  const scoreBars = analysis
    ? [
        { label: 'ATS compatibility', value: analysis.ats.score },
        ...analysis.sections.slice(0, 3).map((section) => ({
          label: section.name,
          value: section.score,
        })),
      ]
    : [];
  const scoreGain = analysis ? analysis.projectedScore - analysis.overallScore : 0;

  return (
    <div className="page page--xwide">
      <div className="dashboard__hero u-fadeup">
        <div className="page__intro">
          <h2>
            {greeting}
            {firstName ? `, ${firstName}` : ''} 👋
          </h2>
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
          {analysisStatus === 'idle' || analysisStatus === 'loading' || analysisStatus === 'analyzing' ? (
            <div className="dashboard__scoreEmpty">
              <Icon name="progress_activity" size={28} spin color="var(--accent)" />
              <p>
                {analysisStatus === 'analyzing'
                  ? 'Analyzing your resume with AI…'
                  : 'Loading your resume score…'}
              </p>
            </div>
          ) : analysisStatus === 'empty' ? (
            <div className="dashboard__scoreEmpty">
              <Icon name="description" size={28} color="var(--amber)" />
              <p>Upload your resume to see your score.</p>
              <Button size="sm" leadingIcon="upload_file" onClick={() => navigate('upload')}>
                Upload resume
              </Button>
            </div>
          ) : analysisStatus === 'error' || !analysis ? (
            <div className="dashboard__scoreEmpty">
              <Icon name="error" size={28} color="var(--red)" />
              <p>{analysisError ?? 'We could not load your resume score.'}</p>
              <Button size="sm" variant="secondary" leadingIcon="refresh" onClick={reanalyze}>
                Try again
              </Button>
            </div>
          ) : (
            <div className="dashboard__scoreRow">
              <div className="dashboard__ringWrap">
                <ScoreRing
                  percent={analysis.overallScore}
                  size={140}
                  label={`Resume score ${analysis.overallScore} out of 100`}
                >
                  <div className="dashboard__ringNum">{analysis.overallScore}</div>
                  <div className="dashboard__ringSub">/ 100</div>
                </ScoreRing>
                {scoreGain > 0 && (
                  <span className="dashboard__delta">
                    <Icon name="trending_up" size={14} />
                    +{scoreGain} possible
                  </span>
                )}
              </div>
              <div className="dashboard__bars">
                {scoreBars.map((bar) => (
                  <div key={bar.label}>
                    <div className="dashboard__barHead">
                      <span>{bar.label}</span>
                      <span>{bar.value === 0 ? '—' : bar.value}</span>
                    </div>
                    <ProgressBar
                      value={bar.value}
                      tone={bar.value >= 72 ? 'accent' : 'amber'}
                      label={`${bar.label} ${bar.value}%`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card padding="lg" className="dashboard__checklist">
          <div className="dashboard__checkHead">
            <span className="dashboard__cardTitle">Improvement checklist</span>
            {analysisStatus === 'done' && analysis && (
              <span className="dashboard__checkCount">
                {analysis.quickWins.length} quick win{analysis.quickWins.length === 1 ? '' : 's'}
              </span>
            )}
          </div>

          {analysisStatus === 'done' && analysis ? (
            analysis.quickWins.length === 0 ? (
              <p className="dashboard__checkEmpty">
                Your resume is in great shape — no quick wins right now.
              </p>
            ) : (
              <>
                <ProgressBar
                  value={(analysis.overallScore / analysis.projectedScore) * 100}
                  className="dashboard__checkBar"
                  label={`Resume score ${analysis.overallScore} of a possible ${analysis.projectedScore}`}
                />
                <ul className="dashboard__checkList">
                  {analysis.quickWins.map((win) => (
                    <li key={win.label} className="dashboard__checkItem">
                      <Icon name="radio_button_unchecked" size={21} color="var(--ink-3)" />
                      <span className="dashboard__checkLabel">{win.label}</span>
                      <span className="dashboard__checkGain">{win.gain}</span>
                    </li>
                  ))}
                </ul>
              </>
            )
          ) : (
            <p className="dashboard__checkEmpty">
              {analysisStatus === 'empty'
                ? 'Upload your resume to get personalized improvement tips.'
                : analysisStatus === 'error'
                  ? (analysisError ?? 'We could not load your improvement checklist.')
                  : 'Loading your improvement checklist…'}
            </p>
          )}

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
