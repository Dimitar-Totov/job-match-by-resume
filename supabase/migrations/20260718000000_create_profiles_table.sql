-- Create profiles table (1:1 with auth.users), RLS policies, updated_at trigger,
-- and a starter-row trigger on auth.users signup.

-- 1. Table -------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text,
  email text,
  field_of_study text,
  graduation_year text,
  target_roles text[],
  target_industries text[],
  experience_level text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'One row per auth.users signup: registration + onboarding data collected client-side.';
comment on column public.profiles.id is 'References auth.users(id); row is deleted when the auth user is deleted.';
comment on column public.profiles.username is 'Username collected at registration (src/features/register/RegisterScreen.tsx).';
comment on column public.profiles.email is 'Email carried through register -> onboarding via router location state.';
comment on column public.profiles.field_of_study is 'Onboarding step 1, single-select from onboardingFields (mockData).';
comment on column public.profiles.graduation_year is 'Onboarding step 1, single-select (e.g. "2024", "2020 or earlier").';
comment on column public.profiles.target_roles is 'Onboarding step 2, multi-select from onboardingRoles (mockData).';
comment on column public.profiles.target_industries is 'Onboarding step 3, multi-select from onboardingIndustries (mockData).';
comment on column public.profiles.experience_level is 'Onboarding step 3, single-select from onboardingExpLevels (mockData).';

-- 2. updated_at auto-touch trigger --------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;

create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

-- 3. Row level security ---------------------------------------------------

alter table public.profiles enable row level security;

drop policy if exists "Profiles are viewable by owner" on public.profiles;
create policy "Profiles are viewable by owner"
on public.profiles
for select
to authenticated
using (auth.uid () = id);

drop policy if exists "Profiles are insertable by owner" on public.profiles;
create policy "Profiles are insertable by owner"
on public.profiles
for insert
to authenticated
with check (auth.uid () = id);

drop policy if exists "Profiles are updatable by owner" on public.profiles;
create policy "Profiles are updatable by owner"
on public.profiles
for update
to authenticated
using (auth.uid () = id)
with check (auth.uid () = id);

-- 4. Auto-create a starter profile row on signup ---------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();
