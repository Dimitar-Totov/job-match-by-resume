import type { FoundJob } from '../types';
import { supabase } from './supabaseClient';

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

interface JobSearchResponse {
  ok: boolean;
  jobs?: FoundJob[];
  reason?: string;
}

/**
 * Real job search via the `job-search` Edge Function: it queries JSearch (a
 * free-tier third-party job search API) for real listings on the chosen site
 * for the given role, and scores each against the caller's resume. Each
 * result's `url` is a real, specific apply link for that posting (not a
 * generic search-results page). Throws the raw Supabase error on invoke
 * failure, or an `Error('search_failed')` when the function reports it could
 * not complete the search — mirrors `resumeService.ts`'s error contract. An
 * empty array is a valid, genuine "no matching jobs" result, not a failure.
 */
export async function searchJobs(siteId: string, query: string): Promise<FoundJob[]> {
  const { data, error } = await supabase.functions.invoke<JobSearchResponse>('job-search', {
    body: { siteId, query: query.trim() },
  });

  if (error) throw error;
  if (!data?.ok) throw new Error('search_failed');

  return data.jobs ?? [];
}
