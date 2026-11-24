-- Cebu Fare Guide production database foundation.
-- Apply in a new Supabase project only after reviewing the policies below.
-- Never put a Supabase service-role key in the browser.
create extension if not exists pgcrypto;

create table if not exists public.lgus (
 id uuid primary key default gen_random_uuid(),
 name text not null unique,
 locality_type text not null default 'municipality' check (locality_type in ('city','municipality')),
 province text not null default 'Cebu',
 is_active boolean not null default true,
 created_at timestamptz not null default now()
);
create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 role text not null default 'commuter' check (role in ('commuter','lgu','admin')),
 lgu_id uuid references public.lgus(id),
 created_at timestamptz not null default now(),
 check ((role='lgu' and lgu_id is not null) or role<>'lgu')
);
create table if not exists public.locations (
 id uuid primary key default gen_random_uuid(),
 name text not null,
 locality text not null,
 barangay text,
 latitude double precision not null,
 longitude double precision not null,
 kind text not null default 'place',
 is_active boolean not null default true,
 created_at timestamptz not null default now()
);
create table if not exists public.transport_modes (
 id text primary key,
 name text not null,
 is_active boolean not null default true
);
create table if not exists public.routes (
 id uuid primary key default gen_random_uuid(),
 route_code text not null,
 name text not null,
 mode_id text not null references public.transport_modes(id),
 operator_name text,
 locality text,
 origin_location_id uuid references public.locations(id),
 destination_location_id uuid references public.locations(id),
 major_stops text,
 distance_km numeric(8,2),
 route_geometry jsonb,
 source_name text,
 source_url text,
 verification_status text not null default 'pending' check (verification_status in ('pending','verified','rejected')),
 verified_at timestamptz,
 effective_from date,
 effective_until date,
 created_at timestamptz not null default now(),
 unique(route_code, mode_id, locality)
);
-- LGU proposals are separate from published fare rules. A commuter can never
-- use a pending proposal in the fare calculator.
create table if not exists public.fare_submissions (
 id uuid primary key default gen_random_uuid(),
 lgu_id uuid not null references public.lgus(id),
 submitted_by uuid not null references auth.users(id),
 mode_id text not null references public.transport_modes(id),
 route_id uuid references public.routes(id),
 route_code text,
 origin_text text,
 destination_text text,
 base_fare numeric(8,2) not null check (base_fare >= 0),
 base_distance_km numeric(8,2) not null check (base_distance_km >= 0),
 succeeding_rate numeric(8,2) not null check (succeeding_rate >= 0),
 succeeding_unit_km numeric(8,2) not null default 1 check (succeeding_unit_km > 0),
 proposed_effective_from date,
 source_name text,
 source_reference text,
 supporting_document_path text,
 review_status text not null default 'pending' check (review_status in ('pending','under_review','approved','rejected')),
 reviewer_id uuid references auth.users(id),
 reviewer_notes text,
 reviewed_at timestamptz,
 created_at timestamptz not null default now()
);
create table if not exists public.fare_rules (
 id uuid primary key default gen_random_uuid(),
 lgu_id uuid references public.lgus(id),
 mode_id text not null references public.transport_modes(id),
 route_id uuid references public.routes(id),
 route_code text,
 vehicle_class text,
 base_fare numeric(8,2) not null check (base_fare >= 0),
 base_distance_km numeric(8,2) not null check (base_distance_km >= 0),
 succeeding_rate numeric(8,2) not null check (succeeding_rate >= 0),
 succeeding_unit_km numeric(8,2) not null default 1 check (succeeding_unit_km > 0),
 source_name text not null,
 source_reference text,
 source_url text,
 effective_from date not null,
 effective_until date,
 verification_status text not null default 'pending' check (verification_status in ('pending','verified','rejected')),
 verified_by uuid references auth.users(id),
 verified_at timestamptz,
 created_at timestamptz not null default now()
);
insert into public.transport_modes(id,name) values
 ('traditional','Traditional jeepney'),('modern','Modern jeepney'),('bus','Bus'),('multicab','Multicab')
on conflict (id) do nothing;

alter table public.lgus enable row level security;
alter table public.profiles enable row level security;
alter table public.locations enable row level security;
alter table public.transport_modes enable row level security;
alter table public.routes enable row level security;
alter table public.fare_submissions enable row level security;
alter table public.fare_rules enable row level security;

-- Public read policies
create policy "public read active LGUs" on public.lgus for select using (is_active=true);
create policy "public read active locations" on public.locations for select using (is_active=true);
create policy "public read active modes" on public.transport_modes for select using (is_active=true);
create policy "public read verified routes" on public.routes for select using (verification_status='verified');
create policy "public read verified fares" on public.fare_rules for select using (verification_status='verified');
-- A user may read only their own profile. Profile role changes must be done
-- by a trusted administrator, never by a public client update.
create policy "read own profile" on public.profiles for select using (id=auth.uid());
-- LGU users may submit for their assigned LGU and read only that LGU's records.
create policy "LGU read own submissions" on public.fare_submissions for select
 using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='lgu' and p.lgu_id=fare_submissions.lgu_id));
create policy "LGU create own submissions" on public.fare_submissions for insert
 with check (submitted_by=auth.uid() and exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='lgu' and p.lgu_id=fare_submissions.lgu_id));
-- No public insert/update/delete policies are granted for fare_rules, routes,
-- LGU membership, or review decisions. Add admin-only server-side policies
-- (or use a protected Edge Function) after establishing trusted admin claims.
