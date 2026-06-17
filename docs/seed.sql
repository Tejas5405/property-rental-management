-- ============================================================================
-- Property Rental Management System (PRMS) — Demo Seed Data
-- ----------------------------------------------------------------------------
-- Run AFTER schema.sql, in: Supabase Dashboard -> SQL Editor -> New query.
--
-- This seed creates real auth.users so the demo credentials below actually log
-- in. The handle_new_user() trigger (from schema.sql) mirrors each auth user
-- into public.users using the name/role in raw_user_meta_data. We then seed the
-- domain tables (properties, tenants, agreements, payments).
--
-- Demo credentials:
--   admin@prms.dev    / Admin1234!  / admin   (System Admin)
--   manager@prms.dev  / Manager1!   / manager (Jane Manager)
--   tenant1@prms.dev  / Tenant1!    / tenant  (Bob Tenant)
--   tenant2@prms.dev  / Tenant1!    / tenant  (Alice Tenant)
--
-- Deterministic UUIDs are used so the seed is idempotent and re-runnable.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. Auth users (GoTrue) — encrypted passwords + identities for email sign-in
-- ----------------------------------------------------------------------------
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000000',
   '00000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated',
   'admin@prms.dev', crypt('Admin1234!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"name":"System Admin","role":"admin","phone":"+1-555-0100"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000',
   '00000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated',
   'manager@prms.dev', crypt('Manager1!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"name":"Jane Manager","role":"manager","phone":"+1-555-0101"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000',
   '00000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated',
   'tenant1@prms.dev', crypt('Tenant1!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"name":"Bob Tenant","role":"tenant","phone":"+1-555-0102"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000',
   '00000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated',
   'tenant2@prms.dev', crypt('Tenant1!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"name":"Alice Tenant","role":"tenant","phone":"+1-555-0103"}', now(), now())
on conflict (id) do nothing;

-- Identities (required by GoTrue for email/password sign-in)
insert into auth.identities (
  id, user_id, identity_data, provider, provider_id,
  last_sign_in_at, created_at, updated_at
)
select
  gen_random_uuid(), u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  'email', u.id::text, now(), now(), now()
from auth.users u
where u.id in (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000004'
)
on conflict (provider, provider_id) do nothing;

-- ----------------------------------------------------------------------------
-- 2. public.users — ensure rows exist even if the trigger was not installed.
--    (No-op when handle_new_user already populated them.)
-- ----------------------------------------------------------------------------
insert into public.users (id, email, name, role, phone)
values
  ('00000000-0000-0000-0000-000000000001', 'admin@prms.dev',   'System Admin', 'admin',   '+1-555-0100'),
  ('00000000-0000-0000-0000-000000000002', 'manager@prms.dev', 'Jane Manager', 'manager', '+1-555-0101'),
  ('00000000-0000-0000-0000-000000000003', 'tenant1@prms.dev', 'Bob Tenant',   'tenant',  '+1-555-0102'),
  ('00000000-0000-0000-0000-000000000004', 'tenant2@prms.dev', 'Alice Tenant', 'tenant',  '+1-555-0103')
on conflict (id) do update
  set name = excluded.name, role = excluded.role, phone = excluded.phone;

-- ----------------------------------------------------------------------------
-- 3. Properties (all assigned to Jane Manager). 2 will become occupied via the
--    sync_property_status trigger when active agreements are inserted below.
-- ----------------------------------------------------------------------------
insert into public.properties (id, name, address, type, status, rent, bedrooms, bathrooms, manager_id)
values
  ('00000000-0000-0000-0000-000000000011', 'Maple Court 4B',  '4 Maple Court, Springfield',     'apartment',  'vacant', 1800, 2, 1,
   '00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000012', 'Birch House',     '88 Birch Lane, Springfield',     'house',      'vacant', 2600, 4, 3,
   '00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000013', 'Cedar Studio 12', '12 Cedar Plaza, Springfield',    'studio',     'vacant', 1100, 0, 1,
   '00000000-0000-0000-0000-000000000002')
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- 4. Tenants (linked to Bob and Alice auth users)
-- ----------------------------------------------------------------------------
insert into public.tenants (id, user_id, name, email, phone)
values
  ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000003', 'Bob Tenant',   'tenant1@prms.dev', '+1-555-0102'),
  ('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000004', 'Alice Tenant', 'tenant2@prms.dev', '+1-555-0103')
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- 5. Agreements (2 active) — these trigger properties -> 'occupied'
-- ----------------------------------------------------------------------------
insert into public.agreements (id, property_id, tenant_id, start_date, end_date, rent, deposit, status)
values
  ('00000000-0000-0000-0000-000000000031',
   '00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000021',
   date '2025-01-01', date '2025-12-31', 1800, 1800, 'active'),
  ('00000000-0000-0000-0000-000000000032',
   '00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000022',
   date '2025-03-01', date '2026-02-28', 2600, 2600, 'active')
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- 6. Payments — 3 paid, 2 pending, 1 overdue
-- ----------------------------------------------------------------------------
insert into public.payments (id, agreement_id, amount, due_date, paid_date, method, status)
values
  -- Bob (agreement 31)
  ('00000000-0000-0000-0000-000000000041', '00000000-0000-0000-0000-000000000031', 1800, date '2025-01-01', date '2025-01-01', 'card', 'paid'),
  ('00000000-0000-0000-0000-000000000042', '00000000-0000-0000-0000-000000000031', 1800, date '2025-02-01', date '2025-02-02', 'bank_transfer', 'paid'),
  ('00000000-0000-0000-0000-000000000043', '00000000-0000-0000-0000-000000000031', 1800, date '2025-03-01', null, null, 'pending'),
  -- Alice (agreement 32)
  ('00000000-0000-0000-0000-000000000044', '00000000-0000-0000-0000-000000000032', 2600, date '2025-03-01', date '2025-03-01', 'card', 'paid'),
  ('00000000-0000-0000-0000-000000000045', '00000000-0000-0000-0000-000000000032', 2600, date '2025-04-01', null, null, 'pending'),
  ('00000000-0000-0000-0000-000000000046', '00000000-0000-0000-0000-000000000032', 2600, date '2025-02-01', null, null, 'overdue')
on conflict (id) do nothing;

-- ============================================================================
-- End of seed.sql
-- ============================================================================
