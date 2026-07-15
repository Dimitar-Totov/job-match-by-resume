import { useMemo, useState } from 'react';
import { Button, Icon } from '../../components';
import { useNav } from '../../hooks/useNav';
import { cn } from '../../utils/cn';
import { scoreTone, statusMeta } from '../../utils/score';
import type { JobStatus } from '../../types';
import { jobs } from '../../services/mockData';
import './jobs.css';

type FilterValue = 'all' | JobStatus;

const COLUMN_ORDER: JobStatus[] = ['saved', 'applied', 'interview', 'offer', 'rejected'];

const STATUS_DOT: Record<JobStatus, string> = {
  saved: 'var(--ink-2)',
  applied: 'var(--accent-ink)',
  interview: 'var(--amber-ink)',
  offer: 'var(--green-ink)',
  rejected: 'var(--red-ink)',
};

export function TrackerScreen() {
  const { navigate } = useNav();
  const [filter, setFilter] = useState<FilterValue>('all');

  const filters = useMemo(() => {
    const counts: { value: FilterValue; label: string; count: number }[] = [
      { value: 'all', label: 'All', count: jobs.length },
    ];
    for (const status of COLUMN_ORDER) {
      counts.push({
        value: status,
        label: statusMeta(status).label,
        count: jobs.filter((job) => job.status === status).length,
      });
    }
    return counts;
  }, []);

  const visibleColumns = COLUMN_ORDER.filter((status) => filter === 'all' || filter === status);

  return (
    <div className="tracker u-fadeup">
      <div className="tracker__filters">
        {filters.map((item) => (
          <button
            key={item.value}
            type="button"
            className={cn('tracker__filter', filter === item.value && 'is-active')}
            aria-pressed={filter === item.value}
            onClick={() => setFilter(item.value)}
          >
            {item.label}
            <span className="tracker__filterCount">{item.count}</span>
          </button>
        ))}
        <Button size="sm" leadingIcon="add" className="tracker__add" onClick={() => navigate('addjob')}>
          Add job
        </Button>
      </div>

      <div className="tracker__board">
        {visibleColumns.map((status) => {
          const columnJobs = jobs.filter((job) => job.status === status);
          const meta = statusMeta(status);
          return (
            <section key={status} className="tracker__col" aria-label={`${meta.label} (${columnJobs.length})`}>
              <div className="tracker__colHead">
                <span className="tracker__dot" style={{ background: STATUS_DOT[status] }} />
                <span className="tracker__colLabel">{meta.label}</span>
                <span className="tracker__colCount">{columnJobs.length}</span>
              </div>
              <div className="tracker__cards">
                {columnJobs.length === 0 ? (
                  <p className="tracker__empty">No jobs here yet.</p>
                ) : (
                  columnJobs.map((job) => (
                    <button
                      key={job.id}
                      type="button"
                      className="tracker__card"
                      onClick={() => navigate('match')}
                    >
                      <div className="tracker__cardHead">
                        <span className="tracker__cardMark" style={{ background: job.color }}>
                          {job.mark}
                        </span>
                        <div className="tracker__cardText">
                          <div className="tracker__cardTitle">{job.title}</div>
                          <div className="tracker__cardCompany">{job.company}</div>
                        </div>
                      </div>
                      <div className="tracker__cardFoot">
                        <span className={cn('scorePill', `scorePill--${scoreTone(job.score)}`)}>
                          {job.score}%
                        </span>
                        <span className="tracker__deadline">
                          <Icon name="event" size={14} />
                          {job.deadline}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
