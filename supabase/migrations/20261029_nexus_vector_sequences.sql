-- Optional schema for an authenticated/shared NEXUS sequence library (not automatically applied).
-- Public reads allowed only for reviewed records. Writes require a separately controlled server role.
create table if not exists public.nexus_vector_sequences (
  accession text primary key,
  name text not null,
  category text not null,
  sequence text not null check (length(sequence) between 1 and 200000 and sequence ~ '^[ACGT]+$'),
  sha256 text not null check (sha256 ~ '^[a-f0-9]{64}$'),
  is_circular boolean not null default true,
  source_url text not null,
  features jsonb not null default '[]'::jsonb,
  annotation_status text not null default 'source_partial',
  reviewed_public boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.nexus_vector_sequences enable row level security;
revoke all on public.nexus_vector_sequences from anon, authenticated;
grant select on public.nexus_vector_sequences to anon, authenticated;
drop policy if exists "Read reviewed public vector records" on public.nexus_vector_sequences;
create policy "Read reviewed public vector records" on public.nexus_vector_sequences
  for select to anon, authenticated using (reviewed_public = true);
-- No insert/update/delete grants to browser roles. Import as an administrator through SQL Editor
-- or a server-only service process, and mark reviewed_public only after provenance/rights review.
