-- Supabase migration for cxr-triage

create table if not exists doctors (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  name text,
  created_at timestamptz default now()
);

create table if not exists cases (
  id text primary key,
  data jsonb not null,
  image_filename text,
  doctor_id uuid references doctors(id) on delete set null,
  created_at timestamptz default now()
);
create index if not exists idx_cases_created_at on cases(created_at desc);

