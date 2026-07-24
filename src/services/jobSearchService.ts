import type { FoundJob, Job } from '../types';
import { jobs } from './mockData';

export interface JobSite {
  id: string;
  label: string;
  icon: string;
  buildSearchUrl: (query: string, location?: string) => string;
}

export const JOB_SITES: JobSite[] = [
  {
    id: 'linkedin',
    label: 'LinkedIn',
    icon: 'work',
    buildSearchUrl: (query, location) => {
      const params = new URLSearchParams({ keywords: query });
      if (location) params.set('location', location);
      return `https://www.linkedin.com/jobs/search/?${params.toString()}`;
    },
  },
  {
    id: 'indeed',
    label: 'Indeed',
    icon: 'travel_explore',
    buildSearchUrl: (query, location) => {
      const params = new URLSearchParams({ q: query });
      if (location) params.set('l', location);
      return `https://www.indeed.com/jobs?${params.toString()}`;
    },
  },
  {
    id: 'glassdoor',
    label: 'Glassdoor',
    icon: 'business_center',
    buildSearchUrl: (query, location) => {
      const params = new URLSearchParams({ 'sc.keyword': query });
      if (location) params.set('locKeyword', location);
      return `https://www.glassdoor.com/Job/jobs.htm?${params.toString()}`;
    },
  },
  {
    id: 'ziprecruiter',
    label: 'ZipRecruiter',
    icon: 'search',
    buildSearchUrl: (query, location) => {
      const params = new URLSearchParams({ search: query });
      if (location) params.set('location', location);
      return `https://www.ziprecruiter.com/candidate/search?${params.toString()}`;
    },
  },
];

const MIN_DELAY_MS = 1200;
const MAX_DELAY_MS = 1800;

function matchesQuery(job: Job, needle: string): boolean {
  if (!needle) return true;
  return job.title.toLowerCase().includes(needle) || job.company.toLowerCase().includes(needle);
}

/**
 * Simulated job search: this project has no real job-search API (see
 * CLAUDE.md — Supabase here is only auth/profile/resume), so this maps the
 * mock `jobs` fixture into `FoundJob[]` behind an artificial network delay,
 * loosely filtered by `query` against title/company (falling back to the
 * full list if nothing matches, so a search never dead-ends in this demo).
 * Each result's `url` is a real, working search-results page on the chosen
 * site for that job's title + company — never a fabricated link to a
 * specific posting that doesn't exist.
 */
export function searchJobs(siteId: string, query: string): Promise<FoundJob[]> {
  const site = JOB_SITES.find((candidate) => candidate.id === siteId) ?? JOB_SITES[0];
  const needle = query.trim().toLowerCase();
  const delay = MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);

  return new Promise((resolve) => {
    window.setTimeout(() => {
      const matched = jobs.filter((job) => matchesQuery(job, needle));
      const source = matched.length > 0 ? matched : jobs;

      resolve(
        source.map((job) => ({
          id: `${site.id}-${job.id}`,
          title: job.title,
          company: job.company,
          mark: job.mark,
          color: job.color,
          location: job.location,
          score: job.score,
          site: site.id,
          siteLabel: site.label,
          url: site.buildSearchUrl(`${job.title} ${job.company}`, job.location),
        })),
      );
    }, delay);
  });
}
