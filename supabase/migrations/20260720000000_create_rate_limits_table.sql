-- Postgres-backed, per-user rate limiter for token-billed Edge Functions.
--
-- Reusable across functions: an Edge Function calls check_rate_limit(action, max,
-- window) via rpc() after authenticating the user, and denies the request when it
-- returns false. Uses only Postgres primitives (no Redis/Upstash, no extra deps).
--
-- The table is fully locked down (RLS on, NO user-facing policies) so a user can
-- neither read nor reset their own counter — only the SECURITY DEFINER function
-- below ever touches it. This mirrors the locked-down style of the profiles
-- migration (20260718000000).

-- 1. Table -------------------------------------------------------------

create table if not exists public.rate_limits (
  user_id uuid not null references auth.users (id) on delete cascade,
  action text not null,
  window_start timestamptz not null,
  count integer not null default 0,
  primary key (user_id, action, window_start)
);

comment on table public.rate_limits is
  'Per-user fixed-window request counters for rate-limited Edge Functions. Written only by public.check_rate_limit() (SECURITY DEFINER); RLS on with no policies so it is not user-readable/writable.';
comment on column public.rate_limits.user_id is 'auth.users(id) the counter belongs to; row cascades away when the user is deleted.';
comment on column public.rate_limits.action is 'Logical endpoint/budget key (e.g. "ai-health"), so different functions have independent limits.';
comment on column public.rate_limits.window_start is 'Start of the fixed time window this count covers (now() floored to the window size).';
comment on column public.rate_limits.count is 'Number of calls recorded in (user_id, action, window_start) so far.';

-- 2. Row level security ---------------------------------------------------
-- Enabled with NO policies: the anon/authenticated roles get zero direct access.
-- Only check_rate_limit() (SECURITY DEFINER, runs as the table owner) can touch it.

alter table public.rate_limits enable row level security;

-- 3. Atomic check-and-increment ------------------------------------------
-- Returns true if the call is within budget, false if it exceeds p_max within the
-- current fixed window. The INSERT ... ON CONFLICT DO UPDATE ... RETURNING is a
-- single statement: concurrent calls serialize on the conflicting row's lock, so
-- the returned post-increment count is race-free (no read-modify-write gap).

create or replace function public.check_rate_limit(
  p_action text,
  p_max integer,
  p_window interval
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_window_start timestamptz;
  v_count integer;
begin
  -- No authenticated user => deny. The Edge Function checks auth first, so this
  -- is just a hard backstop.
  if v_user_id is null then
    return false;
  end if;

  -- Floor now() to the start of the current fixed window of size p_window.
  v_window_start := to_timestamp(
    floor(extract(epoch from now()) / extract(epoch from p_window))
      * extract(epoch from p_window)
  );

  insert into public.rate_limits as rl (user_id, action, window_start, count)
  values (v_user_id, p_action, v_window_start, 1)
  on conflict (user_id, action, window_start)
  do update set count = rl.count + 1
  returning rl.count into v_count;

  return v_count <= p_max;
end;
$$;

comment on function public.check_rate_limit(text, integer, interval) is
  'Atomically records one call for auth.uid() in the current fixed window and returns whether it is within p_max. SECURITY DEFINER so it can write public.rate_limits despite RLS. Callers: Edge Functions via rpc().';

-- Only authenticated callers (and service_role) may invoke it; anon has no reason
-- to (auth.uid() would be null and it would just return false).
revoke all on function public.check_rate_limit(text, integer, interval) from public;
grant execute on function public.check_rate_limit(text, integer, interval) to authenticated, service_role;

-- NOTE: rows for elapsed windows are harmless but accumulate. Purge them
-- periodically as a follow-up, e.g. a scheduled job:
--   delete from public.rate_limits where window_start < now() - interval '1 day';
