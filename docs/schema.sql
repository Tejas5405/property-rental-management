-- ============================================================================
-- Property Rental Management System (PRMS) — Database Schema
-- ----------------------------------------------------------------------------
-- Target: Supabase (PostgreSQL 15+).
-- Run this entire file in: Supabase Dashboard -> SQL Editor -> New query -> Run.
--
-- Object creation order (no forward references):
--   1. Extensions
--   2. Helper functions (current_user_role, set_updated_at, handle_new_user,
--      sync_property_status) — created BEFORE the triggers that call them
--   3. Tables: users -> properties -> tenants -> agreements -> payments
--   4. Partial unique index (one active agreement per property)
--   5. Triggers
--   6. Row-Level Security: ENABLE + policies on all 5 tables
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Extensions
-- ----------------------------------------------------------------------------
create extension if not exists "pgcrypto";   -- gen_random_uuid(), crypt()

-- ----------------------------------------------------------------------------
-- 2. Helper functions (created before any trigger/policy that references them)
-- ----------------------------------------------------------------------------

-- Returns the role of the currently authenticated user (from public.users).
-- SECURITY DEFINER so RLS policies can call it without recursing into users RLS.
-- plpgsql (not sql) so the body is validated lazily at call time — this lets the
-- function be defined before public.users exists in this script.
create or replace function public.current_user_role()
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  select u.role into v_role from public.users u where u.id = auth.uid();
  return v_role;
end;
$$;

-- Generic updated_at maintenance trigger function.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Syncs a new auth.users signup into public.users using user_metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, name, role, phone)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'tenant'),
    new.raw_user_meta_data->>'phone'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Keeps properties.status in sync with the agreement lifecycle.
--   status -> 'active'                 : property becomes 'occupied'
--   status -> 'terminated' | 'expired' : property becomes 'vacant'
create or replace function public.sync_property_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.status = 'active') then
    update public.properties set status = 'occupied' where id = new.property_id;
  elsif (new.status in ('terminated', 'expired')) then
    update public.properties set status = 'vacant' where id = new.property_id;
  end if;
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- 3. Tables
-- ----------------------------------------------------------------------------

-- 3.1 users (mirrors auth.users; row created by handle_new_user trigger)
create table if not exists public.users (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null unique,
  name        text not null,
  role        text not null default 'tenant'
              check (role in ('admin', 'manager', 'tenant')),
  phone       text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 3.2 properties
create table if not exists public.properties (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  address     text not null,
  type        text not null
              check (type in ('apartment', 'house', 'commercial', 'studio')),
  status      text not null default 'vacant'
              check (status in ('vacant', 'occupied', 'maintenance')),
  rent        numeric(12, 2) not null default 0 check (rent >= 0),
  bedrooms    integer not null default 0 check (bedrooms >= 0),
  bathrooms   integer not null default 0 check (bathrooms >= 0),
  manager_id  uuid references public.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 3.3 tenants (a tenant profile, optionally linked to an auth user)
create table if not exists public.tenants (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.users (id) on delete set null,
  name        text not null,
  email       text not null,
  phone       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 3.4 agreements (leases)
create table if not exists public.agreements (
  id          uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  tenant_id   uuid not null references public.tenants (id) on delete cascade,
  start_date  date not null,
  end_date    date not null,
  rent        numeric(12, 2) not null check (rent >= 0),
  deposit     numeric(12, 2) not null default 0 check (deposit >= 0),
  status      text not null default 'active'
              check (status in ('active', 'expired', 'terminated')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint agreements_end_after_start check (end_date > start_date)
);

-- 3.5 payments
create table if not exists public.payments (
  id            uuid primary key default gen_random_uuid(),
  agreement_id  uuid not null references public.agreements (id) on delete cascade,
  amount        numeric(12, 2) not null check (amount >= 0),
  due_date      date not null,
  paid_date     date,
  method        text,
  status        text not null default 'pending'
                check (status in ('paid', 'pending', 'overdue')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 4. Partial unique index — at most ONE active agreement per property
-- ----------------------------------------------------------------------------
create unique index if not exists one_active_agreement_per_property
  on public.agreements (property_id)
  where status = 'active';

-- Helpful secondary indexes
create index if not exists idx_properties_manager on public.properties (manager_id);
create index if not exists idx_agreements_property on public.agreements (property_id);
create index if not exists idx_agreements_tenant   on public.agreements (tenant_id);
create index if not exists idx_payments_agreement  on public.payments (agreement_id);

-- ----------------------------------------------------------------------------
-- 5. Triggers
-- ----------------------------------------------------------------------------

-- 5.1 Sync new signups into public.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5.2 Keep property occupancy in sync with agreement status
drop trigger if exists trg_sync_property_status on public.agreements;
create trigger trg_sync_property_status
  after insert or update of status on public.agreements
  for each row execute function public.sync_property_status();

-- 5.3 updated_at maintenance
drop trigger if exists trg_users_updated_at on public.users;
create trigger trg_users_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

drop trigger if exists trg_properties_updated_at on public.properties;
create trigger trg_properties_updated_at
  before update on public.properties
  for each row execute function public.set_updated_at();

drop trigger if exists trg_tenants_updated_at on public.tenants;
create trigger trg_tenants_updated_at
  before update on public.tenants
  for each row execute function public.set_updated_at();

drop trigger if exists trg_agreements_updated_at on public.agreements;
create trigger trg_agreements_updated_at
  before update on public.agreements
  for each row execute function public.set_updated_at();

drop trigger if exists trg_payments_updated_at on public.payments;
create trigger trg_payments_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 6. Row-Level Security
-- ----------------------------------------------------------------------------
-- NOTE: the backend uses the service_role key, which BYPASSES RLS. These
-- policies are defense-in-depth for any direct (anon/authenticated) access.

alter table public.users      enable row level security;
alter table public.properties enable row level security;
alter table public.tenants    enable row level security;
alter table public.agreements enable row level security;
alter table public.payments   enable row level security;

-- ---------------------------- users ----------------------------------------
drop policy if exists users_select on public.users;
create policy users_select on public.users
  for select using (
    public.current_user_role() = 'admin'
    or id = auth.uid()
  );

drop policy if exists users_insert on public.users;
create policy users_insert on public.users
  for insert with check (
    public.current_user_role() = 'admin'
  );

drop policy if exists users_update on public.users;
create policy users_update on public.users
  for update using (
    public.current_user_role() = 'admin'
    or id = auth.uid()
  ) with check (
    public.current_user_role() = 'admin'
    or id = auth.uid()
  );

drop policy if exists users_delete on public.users;
create policy users_delete on public.users
  for delete using (public.current_user_role() = 'admin');

-- -------------------------- properties -------------------------------------
drop policy if exists properties_select on public.properties;
create policy properties_select on public.properties
  for select using (
    public.current_user_role() = 'admin'
    or manager_id = auth.uid()
    or exists (
      select 1
      from public.agreements a
      join public.tenants t on t.id = a.tenant_id
      where a.property_id = properties.id
        and t.user_id = auth.uid()
    )
  );

drop policy if exists properties_insert on public.properties;
create policy properties_insert on public.properties
  for insert with check (
    public.current_user_role() = 'admin'
    or (public.current_user_role() = 'manager' and manager_id = auth.uid())
  );

drop policy if exists properties_update on public.properties;
create policy properties_update on public.properties
  for update using (
    public.current_user_role() = 'admin'
    or manager_id = auth.uid()
  ) with check (
    public.current_user_role() = 'admin'
    or manager_id = auth.uid()
  );

drop policy if exists properties_delete on public.properties;
create policy properties_delete on public.properties
  for delete using (public.current_user_role() = 'admin');

-- --------------------------- tenants ---------------------------------------
drop policy if exists tenants_select on public.tenants;
create policy tenants_select on public.tenants
  for select using (
    public.current_user_role() in ('admin', 'manager')
    or user_id = auth.uid()
  );

drop policy if exists tenants_insert on public.tenants;
create policy tenants_insert on public.tenants
  for insert with check (
    public.current_user_role() in ('admin', 'manager')
  );

drop policy if exists tenants_update on public.tenants;
create policy tenants_update on public.tenants
  for update using (
    public.current_user_role() in ('admin', 'manager')
    or user_id = auth.uid()
  ) with check (
    public.current_user_role() in ('admin', 'manager')
    or user_id = auth.uid()
  );

drop policy if exists tenants_delete on public.tenants;
create policy tenants_delete on public.tenants
  for delete using (public.current_user_role() = 'admin');

-- -------------------------- agreements -------------------------------------
drop policy if exists agreements_select on public.agreements;
create policy agreements_select on public.agreements
  for select using (
    public.current_user_role() = 'admin'
    or exists (
      select 1 from public.properties p
      where p.id = agreements.property_id and p.manager_id = auth.uid()
    )
    or exists (
      select 1 from public.tenants t
      where t.id = agreements.tenant_id and t.user_id = auth.uid()
    )
  );

drop policy if exists agreements_insert on public.agreements;
create policy agreements_insert on public.agreements
  for insert with check (
    public.current_user_role() = 'admin'
    or exists (
      select 1 from public.properties p
      where p.id = agreements.property_id and p.manager_id = auth.uid()
    )
  );

drop policy if exists agreements_update on public.agreements;
create policy agreements_update on public.agreements
  for update using (
    public.current_user_role() = 'admin'
    or exists (
      select 1 from public.properties p
      where p.id = agreements.property_id and p.manager_id = auth.uid()
    )
  );

drop policy if exists agreements_delete on public.agreements;
create policy agreements_delete on public.agreements
  for delete using (public.current_user_role() = 'admin');

-- --------------------------- payments --------------------------------------
drop policy if exists payments_select on public.payments;
create policy payments_select on public.payments
  for select using (
    public.current_user_role() = 'admin'
    or exists (
      select 1
      from public.agreements a
      join public.properties p on p.id = a.property_id
      where a.id = payments.agreement_id and p.manager_id = auth.uid()
    )
    or exists (
      select 1
      from public.agreements a
      join public.tenants t on t.id = a.tenant_id
      where a.id = payments.agreement_id and t.user_id = auth.uid()
    )
  );

drop policy if exists payments_insert on public.payments;
create policy payments_insert on public.payments
  for insert with check (
    public.current_user_role() = 'admin'
    or exists (
      select 1
      from public.agreements a
      join public.properties p on p.id = a.property_id
      where a.id = payments.agreement_id and p.manager_id = auth.uid()
    )
  );

drop policy if exists payments_update on public.payments;
create policy payments_update on public.payments
  for update using (
    public.current_user_role() = 'admin'
    or exists (
      select 1
      from public.agreements a
      join public.properties p on p.id = a.property_id
      where a.id = payments.agreement_id and p.manager_id = auth.uid()
    )
  );

drop policy if exists payments_delete on public.payments;
create policy payments_delete on public.payments
  for delete using (public.current_user_role() = 'admin');

-- ============================================================================
-- End of schema.sql
-- ============================================================================
