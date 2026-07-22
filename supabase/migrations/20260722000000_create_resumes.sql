-- Resume storage + parsed-data table.
--
-- Two pieces, both owner-scoped like the profiles migration (20260718000000):
--   1. A PRIVATE Storage bucket ('resumes') for the raw uploaded PDF, with
--      RLS on storage.objects so a user can only touch files under their own
--      "{auth.uid()}/..." folder.
--   2. A public.resumes table (1:1 with auth.users) holding the storage path,
--      original file name, the AI-extracted structured data (jsonb), and a
--      status. Written by the client's upload step and the resume-parse Edge
--      Function (both run as the user, so the owner RLS policies apply).

-- 1. Storage bucket -------------------------------------------------------
-- Private (public = false): files are reachable only via an authenticated
-- client or a signed URL, never a public URL.

insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do nothing;

-- storage.objects already has RLS enabled by Supabase; we just add policies.
-- The first path segment is the owner's uid, e.g. "<uid>/<uuid>.pdf", so
-- (storage.foldername(name))[1] must equal auth.uid().

drop policy if exists "Resumes are readable by owner" on storage.objects;
create policy "Resumes are readable by owner"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'resumes'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Resumes are insertable by owner" on storage.objects;
create policy "Resumes are insertable by owner"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'resumes'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Resumes are updatable by owner" on storage.objects;
create policy "Resumes are updatable by owner"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'resumes'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'resumes'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Resumes are deletable by owner" on storage.objects;
create policy "Resumes are deletable by owner"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'resumes'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. Parsed-resume table --------------------------------------------------
-- One row per user (user_id primary key). Upserted on each parse, so a user's
-- latest resume replaces the previous one. `parsed` holds the ParsedResume
-- shape (src/types/index.ts) as jsonb.

create table if not exists public.resumes (
  user_id uuid primary key references auth.users (id) on delete cascade,
  storage_path text,
  file_name text,
  parsed jsonb,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.resumes is
  'One row per user: the raw resume file location (in the private "resumes" Storage bucket) plus its AI-extracted structured data.';
comment on column public.resumes.user_id is 'References auth.users(id); row is deleted when the auth user is deleted.';
comment on column public.resumes.storage_path is 'Path within the "resumes" Storage bucket, e.g. "<uid>/<uuid>.pdf".';
comment on column public.resumes.file_name is 'Original client-side file name, for display in the UI.';
comment on column public.resumes.parsed is 'AI-extracted resume as jsonb (matches the ParsedResume type). Null until parsing succeeds.';
comment on column public.resumes.status is 'pending (uploaded, not yet parsed) | parsed (parsed ok) | failed (parse failed).';

-- Reuse the updated_at auto-touch function created in 20260718000000.
drop trigger if exists set_resumes_updated_at on public.resumes;
create trigger set_resumes_updated_at
before update on public.resumes
for each row
execute function public.set_updated_at();

-- 3. Row level security ---------------------------------------------------

alter table public.resumes enable row level security;

drop policy if exists "Resumes rows are viewable by owner" on public.resumes;
create policy "Resumes rows are viewable by owner"
on public.resumes
for select
to authenticated
using (auth.uid () = user_id);

drop policy if exists "Resumes rows are insertable by owner" on public.resumes;
create policy "Resumes rows are insertable by owner"
on public.resumes
for insert
to authenticated
with check (auth.uid () = user_id);

drop policy if exists "Resumes rows are updatable by owner" on public.resumes;
create policy "Resumes rows are updatable by owner"
on public.resumes
for update
to authenticated
using (auth.uid () = user_id)
with check (auth.uid () = user_id);
