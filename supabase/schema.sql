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
  submitted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  last_confirmed_at timestamptz not null default now()
);

comment on column contacts.role_title is
  'The recruiter''s own role, e.g. "University Recruiter" or "Campus Recruiting Lead".';
comment on column contacts.job_title is
  'The job posting/req this contact is tied to, e.g. "Software Engineer Intern" -- not the recruiter''s title.';

create table if not exists contact_votes (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references contacts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  unique (contact_id, user_id)
);

create table if not exists contact_flags (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references contacts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reason text,
  created_at timestamptz not null default now(),
  unique (contact_id, user_id)
);

create table if not exists company_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (company_id, user_id)
);

-- Indexes for foreign-key lookups (Postgres does not create these automatically,
-- and every query pattern above -- "contacts for a company", "votes for a
-- contact", "my votes", "flags for a contact" -- filters on one of these).
create index if not exists contacts_company_id_idx on contacts (company_id);
create index if not exists contacts_submitted_by_idx on contacts (submitted_by);
create index if not exists contact_votes_contact_id_idx on contact_votes (contact_id);
create index if not exists contact_votes_user_id_idx on contact_votes (user_id);
create index if not exists contact_flags_contact_id_idx on contact_flags (contact_id);
create index if not exists contact_flags_user_id_idx on contact_flags (user_id);
create index if not exists company_requests_company_id_idx on company_requests (company_id);
create index if not exists company_requests_user_id_idx on company_requests (user_id);

-- Case-insensitive uniqueness on domain so "Acme.com" and "acme.com" can't
-- both be registered as separate companies.
create unique index if not exists companies_domain_lower_idx
  on companies (lower(domain))
  where domain is not null;

-- Normalize free-text fields on write so dedup/lookups behave consistently
-- even if a future write path forgets to trim/lowercase in the app layer.
create or replace function normalize_company_fields()
returns trigger
language plpgsql
as $$
begin
  new.name := trim(new.name);
  if new.domain is not null then
    new.domain := nullif(lower(trim(new.domain)), '');
  end if;
  return new;
end;
$$;

drop trigger if exists companies_normalize on companies;
create trigger companies_normalize
  before insert or update on companies
  for each row execute function normalize_company_fields();

create or replace function normalize_contact_fields()
returns trigger
language plpgsql
as $$
begin
  new.name := trim(new.name);
  if new.linkedin_url is not null then
    new.linkedin_url := nullif(trim(new.linkedin_url), '');
  end if;
  if new.email is not null then
    new.email := nullif(lower(trim(new.email)), '');
  end if;
  return new;
end;
$$;

drop trigger if exists contacts_normalize on contacts;
create trigger contacts_normalize
  before insert or update on contacts
  for each row execute function normalize_contact_fields();

-- Aggregated score per contact, used for ranking.
-- security_invoker means the view runs with the querying user's own
-- permissions (and RLS), not the permissions of whoever created the view --
-- without this, Postgres views default to the creator's privileges and would
-- silently bypass the RLS policies defined below.
create or replace view contacts_with_score
  with (security_invoker = true) as
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

-- Policies below wrap auth.uid() as (select auth.uid()) per Supabase's
-- performance guidance: as a bare call it is re-evaluated per row scanned,
-- as a scalar subquery Postgres evaluates it once per statement.

-- companies: anyone can read; authenticated users can create
create policy "companies_select_all" on companies for select using (true);
create policy "companies_insert_authenticated" on companies for insert to authenticated with check (true);

-- contacts: anyone can read; authenticated users can create their own; owners can update/delete their own
create policy "contacts_select_all" on contacts for select using (true);
create policy "contacts_insert_authenticated" on contacts for insert to authenticated
  with check (submitted_by = (select auth.uid()));
create policy "contacts_update_own" on contacts for update to authenticated
  using (submitted_by = (select auth.uid()));
create policy "contacts_delete_own" on contacts for delete to authenticated
  using (submitted_by = (select auth.uid()));

-- contact_votes: anyone can read; authenticated users manage their own vote
create policy "votes_select_all" on contact_votes for select using (true);
create policy "votes_upsert_own" on contact_votes for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "votes_update_own" on contact_votes for update to authenticated
  using (user_id = (select auth.uid()));
create policy "votes_delete_own" on contact_votes for delete to authenticated
  using (user_id = (select auth.uid()));

-- contact_flags: anyone can read (kept simple for MVP); authenticated users create their own
create policy "flags_select_all" on contact_flags for select using (true);
create policy "flags_insert_own" on contact_flags for insert to authenticated
  with check (user_id = (select auth.uid()));

-- company_requests ("no contact yet, please add one"): anyone can read; authenticated users create their own
create policy "requests_select_all" on company_requests for select using (true);
create policy "requests_insert_own" on company_requests for insert to authenticated
  with check (user_id = (select auth.uid()));
