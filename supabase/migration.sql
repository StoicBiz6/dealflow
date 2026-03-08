-- Create deals table
create table if not exists public.deals (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),

  company_name  text not null,
  stage         text not null default 'Sourced',
  raise_amount  numeric,
  valuation     numeric,
  sector        text,
  deal_owner    text,
  website       text,
  notes         text
);

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_deals_updated
  before update on public.deals
  for each row execute procedure public.handle_updated_at();

-- Enable Row Level Security
alter table public.deals enable row level security;

-- Policy: allow all operations (you control access via Clerk at the app level)
-- For a private single-user app, allow all authenticated requests
create policy "Allow all" on public.deals
  for all
  using (true)
  with check (true);

-- Seed data
insert into public.deals (company_name, stage, raise_amount, sector, deal_owner) values
  ('Gaming Intelligence', 'Investor Targeting', 2000000,    'Gaming',               'Me'),
  ('Play',                'Investor Targeting', 55000000,   'Gaming',               'Me'),
  ('Ritz Carlton - Tanzania', 'Diligence',      62000000,   'Hospitality',          'Me'),
  ('Pinto',               'Investor Targeting', 40000000,   'Technology',           'Me'),
  ('Formula 1',           'Diligence',          300000000,  'Sports',               'Me'),
  ('Canary',              'Diligence',          40000000,   'Technology',           'Me'),
  ('Amblin Production',   'Sourced',            1000000000, 'Media & Entertainment','Me'),
  ('Fortitude',           'Diligence',          60000000,   'Technology',           'Me'),
  ('Clay',                'Sourced',            15000000,   'Technology',           'Me'),
  ('HC Startup',          'Investor Targeting', 10000000,   'Healthcare',           'Me'),
  ('Starbucks',           'Investor Targeting', 2000000000, 'Consumer',             'Me');
