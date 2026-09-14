-- Recruiter-Finder schema
-- Run this in the Supabase SQL editor (or via `supabase db push`) for a fresh project.

create extension if not exists "pgcrypto";

create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  domain text,
  created_at timestamptz not null default now()
);

create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  role_title text,
  linkedin_url text,
  email text,
  job_title text,
  submitted_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  last_confirmed_at timestamptz not null default now()
);

create table if not exists contact_votes (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references contacts(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  unique (contact_id, user_id)
);

create table if not exists contact_flags (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references contacts(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  reason text,
  created_at timestamptz not null default now(),
  unique (contact_id, user_id)
);

create table if not exists company_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique (company_id, user_id)
);

-- Aggregated score per contact, used for ranking.
create or replace view contacts_with_score as
select
  c.*,
  coalesce(sum(v.value), 0)::int as score
from contacts c
left join contact_votes v on v.contact_id = c.id
group by c.id;

-- Row Level Security
alter table companies enable row level security;
alter table contacts enable row level security;
alter table contact_votes enable row level security;
alter table contact_flags enable row level security;
alter table company_requests enable row level security;

-- companies: anyone can read; authenticated users can create
create policy "companies_select_all" on companies for select using (true);
create policy "companies_insert_authenticated" on companies for insert to authenticated with check (true);

-- contacts: anyone can read; authenticated users can create their own; owners can update/delete their own
create policy "contacts_select_all" on contacts for select using (true);
create policy "contacts_insert_authenticated" on contacts for insert to authenticated
  with check (submitted_by = auth.uid());
create policy "contacts_update_own" on contacts for update to authenticated
  using (submitted_by = auth.uid());
create policy "contacts_delete_own" on contacts for delete to authenticated
  using (submitted_by = auth.uid());

-- contact_votes: anyone can read; authenticated users manage their own vote
create policy "votes_select_all" on contact_votes for select using (true);
create policy "votes_upsert_own" on contact_votes for insert to authenticated
  with check (user_id = auth.uid());
create policy "votes_update_own" on contact_votes for update to authenticated
  using (user_id = auth.uid());
create policy "votes_delete_own" on contact_votes for delete to authenticated
  using (user_id = auth.uid());

-- contact_flags: anyone can read (kept simple for MVP); authenticated users create their own
create policy "flags_select_all" on contact_flags for select using (true);
create policy "flags_insert_own" on contact_flags for insert to authenticated
  with check (user_id = auth.uid());

-- company_requests ("no contact yet, please add one"): anyone can read; authenticated users create their own
create policy "requests_select_all" on company_requests for select using (true);
create policy "requests_insert_own" on company_requests for insert to authenticated
  with check (user_id = auth.uid());
