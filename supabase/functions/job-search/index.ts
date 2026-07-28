// Deno Edge Function — search real job listings on the site the user picked,
// scored against their resume.
//
// Flow: the client (jobSearchService.searchJobs) sends { siteId, query }. We call
// JSearch (https://jsearch.p.rapidapi.com), a job search API with a genuinely
// free tier (200 requests/month, no credit card) that aggregates real listings —
// including LinkedIn, Indeed, Glassdoor, and ZipRecruiter — via Google for Jobs.
// Results are filtered to the chosen site and to the role actually asked for
// (tiered: exact-ish title match first, falling back to a substring match only
// if that's empty; genuinely empty results are returned as such, never padded
// with unrelated postings), then scored against the caller's already-parsed
// resume using the same free OpenRouter model used elsewhere in this app (falls
// back to a deterministic heuristic if the caller has no parsed resume yet, to
// avoid a wasted model call).
//
// RAPIDAPI_KEY is a new required secret (server-side only), separate from
// OPENROUTER_API_KEY. JSearch's free tier is shared across the whole app by
// this one key, not per-user, so the per-user rate limit below is an abuse
// guard, not a substitute for watching total usage.
//
// The shared preamble (CORS, in-function auth, per-user rate limiting) and the
// OpenRouter client setup live in _shared/ (see ai-health, the template).
import { arr, createAiClient, getModel, obj, stripFence } from '../_shared/ai.ts';
import { withAiGuards } from '../_shared/guards.ts';

// Per-user budget. JSearch's free tier is only 200 requests/month total for
// this app, so this stays far tighter than the AI endpoints' 10/hour.
const RATE_LIMIT = { action: 'job-search', max: 5, window: '1 day' };

const SITE_LABELS: Record<string, string> = {
  linkedin: 'LinkedIn',
  indeed: 'Indeed',
  glassdoor: 'Glassdoor',
  ziprecruiter: 'ZipRecruiter',
};

const MAX_RESULTS = 8;
const MAX_PROMPT_CHARS = 20000;

interface FoundJob {
  id: string;
  title: string;
  company: string;
  mark: string;
  color: string;
  location: string;
  score: number;
  site: string;
  siteLabel: string;
  url: string;
}

interface JSearchJob {
  job_id?: string;
  job_title?: string;
  employer_name?: string;
  job_city?: string;
  job_state?: string;
  job_country?: string;
  job_is_remote?: boolean;
  job_apply_link?: string;
  job_publisher?: string;
  job_description?: string;
  apply_options?: { publisher?: string }[];
}

// A small fixed palette, same spirit as the per-company colors in mockData.ts.
const COLOR_PALETTE = [
  '#635bff', '#5e6ad2', '#111827', '#a259ff', '#0f172a',
  '#7c3aed', '#ff385c', '#2563eb', '#059669', '#d97706',
];

function normalize(v: string): string {
  return v.trim().toLowerCase().replace(/\s+/g, ' ');
}

// Mirrors src/utils/initials.ts's algorithm (not importable from an Edge Function).
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (name.trim().slice(0, 2) || '??').toUpperCase();
}

function colorOf(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return COLOR_PALETTE[hash % COLOR_PALETTE.length];
}

function publishesOn(job: JSearchJob, siteLabel: string): boolean {
  const needle = siteLabel.toLowerCase();
  const publishers = [job.job_publisher, ...(job.apply_options ?? []).map((o) => o.publisher)]
    .filter((p): p is string => typeof p === 'string')
    .map((p) => p.toLowerCase());
  return publishers.some((p) => p.includes(needle));
}

function titleMatches(job: JSearchJob, normalizedQuery: string, strict: boolean): boolean {
  const title = normalize(job.job_title ?? '');
  if (!title) return false;
  if (strict) return title === normalizedQuery || title.startsWith(`${normalizedQuery} `);
  return title.includes(normalizedQuery);
}

function locationOf(job: JSearchJob): string {
  if (job.job_is_remote) return 'Remote';
  return [job.job_city, job.job_state, job.job_country].filter(Boolean).join(', ') || 'Not specified';
}

Deno.serve((req) =>
  withAiGuards(req, RATE_LIMIT, async ({ supabase, userId, jsonHeaders, req: request }) => {
    // --- Validate input ------------------------------------------------------
    let siteId: string;
    let query: string;
    try {
      const body = await request.json();
      siteId = typeof body?.siteId === 'string' ? body.siteId : '';
      query = typeof body?.query === 'string' ? body.query.trim() : '';
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid request body' }), { headers: jsonHeaders, status: 400 });
    }

    const siteLabel = SITE_LABELS[siteId];
    if (!siteLabel || !query) {
      return new Response(JSON.stringify({ error: 'Invalid site or query' }), { headers: jsonHeaders, status: 400 });
    }

    const rapidApiKey = Deno.env.get('RAPIDAPI_KEY');
    if (!rapidApiKey) {
      console.error('Job search: RAPIDAPI_KEY is not set');
      return new Response(JSON.stringify({ ok: false, reason: 'search_failed' }), { headers: jsonHeaders, status: 200 });
    }

    try {
      // --- Real search via JSearch --------------------------------------------
      const searchUrl = `https://jsearch.p.rapidapi.com/search-v2?query=${encodeURIComponent(`${query} jobs`)}&num_pages=1`;
      const response = await fetch(searchUrl, {
        headers: { 'x-rapidapi-key': rapidApiKey, 'x-rapidapi-host': 'jsearch.p.rapidapi.com' },
      });

      if (!response.ok) {
        throw new Error(`JSearch request failed: ${response.status}`);
      }

      const payload = await response.json();
      const rawJobs: JSearchJob[] = Array.isArray(payload?.data?.jobs) ? payload.data.jobs : [];
      const needle = normalize(query);

      // Only jobs that (a) publish on the chosen site and (b) have a real apply
      // link are eligible at all.
      const onSite = rawJobs.filter((job) => publishesOn(job, siteLabel) && job.job_apply_link);

      // Tier 1: exact-ish role match. Tier 2 (only if tier 1 is empty): loose
      // substring match. If both are empty, that's a genuine "no results" —
      // never padded with unrelated postings.
      let matched = onSite.filter((job) => titleMatches(job, needle, true));
      let strictMatch = true;
      if (matched.length === 0) {
        matched = onSite.filter((job) => titleMatches(job, needle, false));
        strictMatch = false;
      }
      matched = matched.slice(0, MAX_RESULTS);

      if (matched.length === 0) {
        return new Response(JSON.stringify({ ok: true, jobs: [] }), { headers: jsonHeaders, status: 200 });
      }

      // --- Score against the caller's resume, if they have one ---------------
      const { data: row } = await supabase.from('resumes').select('parsed').eq('user_id', userId).maybeSingle();
      const parsed = row?.parsed ?? null;

      const scoreByIndex = new Map<number, number>();
      if (parsed && typeof parsed === 'object') {
        try {
          const openai = createAiClient();
          const model = getModel();
          const jobList = matched.map((job, index) => ({
            index,
            title: job.job_title ?? '',
            company: job.employer_name ?? '',
            description: (job.job_description ?? '').slice(0, 600),
          }));

          const completion = await openai.chat.completions.create({
            model,
            temperature: 0.2,
            response_format: { type: 'json_object' },
            messages: [
              {
                role: 'system',
                content:
                  'You score how well job listings match a candidate resume. Given a resume (JSON) and a list of jobs, return JSON exactly like {"scores":[{"index":number,"score":number}]} with one entry per job, "score" 0-100 (0=no fit, 100=ideal fit) based on skills/experience overlap. Output ONLY the JSON object, no markdown, no commentary.',
              },
              {
                role: 'user',
                content: JSON.stringify({ resume: parsed, jobs: jobList }).slice(0, MAX_PROMPT_CHARS),
              },
            ],
          });

          const content = completion.choices[0]?.message?.content?.trim() ?? '';
          const scored = arr(obj(JSON.parse(stripFence(content))).scores);
          for (const entry of scored) {
            const e = obj(entry);
            const index = typeof e.index === 'number' ? e.index : Number(e.index);
            const score = typeof e.score === 'number' ? e.score : Number(e.score);
            if (Number.isInteger(index) && index >= 0 && index < matched.length && Number.isFinite(score)) {
              scoreByIndex.set(index, Math.max(0, Math.min(100, Math.round(score))));
            }
          }
        } catch (scoreError) {
          // Scoring is a nice-to-have on top of real search results — fall back
          // to the heuristic below rather than failing the whole search.
          console.error(
            'Job search: resume scoring failed, using heuristic instead:',
            scoreError instanceof Error ? scoreError.message : 'Unknown error',
          );
        }
      }

      const heuristicScore = strictMatch ? 88 : 72;

      const jobs: FoundJob[] = matched.map((job, index) => {
        const company = job.employer_name || 'Unknown company';
        const jobId = job.job_id ?? `${siteId}-${index}`;
        return {
          id: `${siteId}-${jobId}`,
          title: job.job_title || query,
          company,
          mark: initialsOf(company),
          color: colorOf(company),
          location: locationOf(job),
          score: scoreByIndex.get(index) ?? heuristicScore,
          site: siteId,
          siteLabel,
          url: job.job_apply_link ?? '',
        };
      });

      return new Response(JSON.stringify({ ok: true, jobs }), { headers: jsonHeaders, status: 200 });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Job search failed:', message);
      return new Response(JSON.stringify({ ok: false, reason: 'search_failed' }), { headers: jsonHeaders, status: 200 });
    }
  }),
);
