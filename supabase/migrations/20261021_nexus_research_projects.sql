-- NEXUS v1.8.5: browser research workspace. Run in Supabase SQL Editor.
-- Do NOT run as a script bundled into the website. This SQL is for the project administrator.
-- One user owns each record; users cannot list, alter, or delete other users' records.
create table if not exists public.nexus_projects (
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null check (project_id ~ '^[A-Z0-9][A-Z0-9_-]{2,49}$'),
  name text not null check (char_length(name) between 1 and 120),
  document jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, project_id),
  constraint valid_nexus_project check (
    jsonb_typeof(document) = 'object'
    and document->>'schema' = 'nexus-project-v1'
    and document->>'id' = project_id
    and jsonb_typeof(document->'modules') = 'object'
    and jsonb_typeof(document->'qc') = 'array'
    and octet_length(document::text) <= 1000000
  )
);

create index if not exists nexus_projects_user_last_updated on public.nexus_projects (user_id, updated_at desc);
alter table public.nexus_projects enable row level security;
-- Use distinct operation policies and no public / anonymous access.
revoke all on public.nexus_projects from anon;
revoke all on public.nexus_projects from authenticated;
grant select, insert, update, delete on public.nexus_projects to authenticated;

drop policy if exists nexus_select_own on public.nexus_projects;
create policy nexus_select_own on public.nexus_projects for select to authenticated
  using ((select auth.uid()) = user_id);
drop policy if exists nexus_insert_own on public.nexus_projects;
create policy nexus_insert_own on public.nexus_projects for insert to authenticated
  with check ((select auth.uid()) = user_id);
drop policy if exists nexus_update_own on public.nexus_projects;
create policy nexus_update_own on public.nexus_projects for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
drop policy if exists nexus_delete_own on public.nexus_projects;
create policy nexus_delete_own on public.nexus_projects for delete to authenticated
  using ((select auth.uid()) = user_id);

-- This release deliberately has no subscription/entitlements table or client-settable roles.
-- Pro features should NEVER be authorized via localStorage, JS visibility, or user metadata alone.
