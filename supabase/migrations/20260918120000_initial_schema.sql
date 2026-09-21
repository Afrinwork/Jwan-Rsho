-- Stage 1: initial Postgres schema + RLS for the Firebase -> Supabase migration.
-- Mirrors firebase/firestore.rules and firebase/storage.rules exactly (see migration plan).
-- Applies to a project no client code points at yet -- zero production risk.

-- =========================================================================
-- Tables
-- =========================================================================

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null,
  role text not null check (role in ('super_admin', 'admin', 'driver')),
  manager_id uuid references public.profiles (id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_manager_id_idx on public.profiles (manager_id);

create table public.customers (
  id text primary key,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  full_name text not null,
  phone text,
  address text,
  city text,
  normalized_city text,
  country text,
  region text,
  latitude double precision,
  longitude double precision,
  location_status text,
  note text,
  assigned_driver_id uuid references public.profiles (id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index customers_owner_full_name_idx on public.customers (owner_id, full_name);
create index customers_owner_city_full_name_idx on public.customers (owner_id, normalized_city, full_name);

create table public.orders (
  id text primary key,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  customer_id text not null references public.customers (id) on delete cascade,
  status text not null check (status in ('open', 'completed', 'cancelled')),
  request_id text,
  note text,
  -- Point-in-time mirror of the customer's assigned driver at order time.
  -- Deliberately NOT kept in sync via FK cascade logic -- matches existing
  -- Firestore behavior where this is an app-level mirrored write.
  assigned_driver_id uuid references public.profiles (id) on delete set null,
  ordered_at timestamptz not null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_owner_status_ordered_at_idx on public.orders (owner_id, status, ordered_at desc);
create index orders_owner_ordered_at_idx on public.orders (owner_id, ordered_at desc);
create index orders_owner_customer_ordered_at_idx on public.orders (owner_id, customer_id, ordered_at desc);
create index orders_owner_status_completed_at_idx on public.orders (owner_id, status, completed_at asc);
create index orders_owner_driver_status_completed_at_idx on public.orders (owner_id, assigned_driver_id, status, completed_at asc);

-- Owner-scoped catalog tables. country/region/city fields stay free-text
-- (not FKs) to preserve today's denormalized string-matching behavior --
-- tightening into real FKs is a legitimate future improvement, out of
-- scope here since it risks rejecting/orphaning existing data on import.
create table public.products (
  id text primary key,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  name_ar text,
  normalized_name text not null,
  default_unit text not null,
  emoji text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_owner_sort_name_idx on public.products (owner_id, sort_order, name);

create table public.countries (
  id text primary key,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  name_ar text,
  normalized_name text not null,
  iso_code text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index countries_owner_sort_name_idx on public.countries (owner_id, sort_order, name);

create table public.regions (
  id text primary key,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  name_ar text,
  normalized_name text not null,
  country text,
  normalized_country text,
  city text,
  normalized_city text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index regions_owner_country_name_idx on public.regions (owner_id, country, name);

create table public.cities (
  id text primary key,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  name_ar text,
  normalized_name text not null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- No owner_id column on order_items: was only a Firestore rule-scoping
-- hack for collectionGroup queries. A normal FK join through orders
-- covers this natively in Postgres (see RLS policies below).
create table public.order_items (
  id text primary key,
  order_id text not null references public.orders (id) on delete cascade,
  product_id text references public.products (id) on delete set null,
  product_name_snapshot text not null,
  quantity numeric not null,
  unit text not null,
  sort_order integer not null default 0
);

create index order_items_order_id_idx on public.order_items (order_id);
create index order_items_product_id_idx on public.order_items (product_id);

create table public.user_preferences (
  id uuid primary key references public.profiles (id) on delete cascade,
  theme_mode text,
  language text,
  preferred_navigation_app text,
  shop_name text,
  share_include_address boolean not null default true,
  share_include_phone boolean not null default true,
  share_include_totals boolean not null default true,
  whatsapp_selection_template text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.driver_completion_stats (
  driver_id uuid primary key references public.profiles (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  date text not null,
  count integer not null default 0,
  updated_at timestamptz not null default now()
);

create table public.driver_check_ins (
  driver_id uuid not null references public.profiles (id) on delete cascade,
  date text not null,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  status text not null check (status in ('pending', 'ok', 'blocked')),
  blocked_reason text check (blocked_reason in ('max_attempts', 'no_response_by_10', 'admin_blocked')),
  attempts integer not null default 0,
  address text,
  latitude double precision,
  longitude double precision,
  gps_accuracy double precision,
  odometer_km numeric,
  photo_storage_path text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (driver_id, date)
);

create index driver_check_ins_owner_id_idx on public.driver_check_ins (owner_id);

-- =========================================================================
-- Helper functions (SECURITY DEFINER so RLS policies querying `profiles`
-- from within a `profiles` policy don't recurse into themselves --
-- equivalent to Firestore rules' callerProfile()/get() pattern).
-- =========================================================================

create function public.fn_caller_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create function public.fn_caller_manager_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select manager_id from public.profiles where id = auth.uid();
$$;

create function public.fn_is_assigned_driver_for(p_owner_id uuid, p_assigned_driver_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_assigned_driver_id = auth.uid()
    and public.fn_caller_role() = 'driver'
    and public.fn_caller_manager_id() = p_owner_id;
$$;

-- =========================================================================
-- Trigger: profiles self-update guard.
-- Equivalent to Firestore rules' selfUpdateIsSafe() -- a self-update must
-- leave role/manager_id/is_active unchanged. Only fires for the
-- `authenticated` role; the service-role client used by Edge Functions
-- bypasses this (same as firebase-admin bypassing Firestore rules).
-- =========================================================================

create function public.enforce_profile_self_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'authenticated' then
    if new.role is distinct from old.role
      or new.manager_id is distinct from old.manager_id
      or new.is_active is distinct from old.is_active then
      raise exception 'Cannot modify role, manager_id, or is_active via self-update';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_enforce_profile_self_update
before update on public.profiles
for each row
execute function public.enforce_profile_self_update();

-- =========================================================================
-- Trigger: driver_check_ins update guard.
-- Equivalent to Firestore rules' checkInIdentityUnchanged() +
-- adminBlockUntouched() + the manager-can-only-touch-status/blockedReason
-- field-diff check. A pure WITH CHECK can't compare OLD vs NEW, so this
-- needs to be a trigger.
-- =========================================================================

create function public.enforce_checkin_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.driver_id is distinct from old.driver_id
    or new.owner_id is distinct from old.owner_id
    or new.date is distinct from old.date then
    raise exception 'driver_id, owner_id, and date are immutable on driver_check_ins';
  end if;

  if auth.uid() = old.driver_id then
    if old.blocked_reason = 'admin_blocked' and new.blocked_reason is distinct from 'admin_blocked' then
      raise exception 'Drivers cannot clear an admin-set block themselves';
    end if;
  elsif auth.uid() = old.owner_id then
    if new.attempts is distinct from old.attempts
      or new.address is distinct from old.address
      or new.latitude is distinct from old.latitude
      or new.longitude is distinct from old.longitude
      or new.gps_accuracy is distinct from old.gps_accuracy
      or new.odometer_km is distinct from old.odometer_km
      or new.photo_storage_path is distinct from old.photo_storage_path
      or new.completed_at is distinct from old.completed_at
      or new.created_at is distinct from old.created_at then
      raise exception 'Managers may only update status, blocked_reason, and updated_at';
    end if;
  end if;

  return new;
end;
$$;

create trigger trg_enforce_checkin_update
before update on public.driver_check_ins
for each row
execute function public.enforce_checkin_update();

-- =========================================================================
-- Row Level Security
-- =========================================================================

alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.products enable row level security;
alter table public.countries enable row level security;
alter table public.regions enable row level security;
alter table public.cities enable row level security;
alter table public.user_preferences enable row level security;
alter table public.driver_completion_stats enable row level security;
alter table public.driver_check_ins enable row level security;

-- profiles: read self or own team; no client-side insert/privileged
-- update/delete (Edge Functions with the service-role key handle those,
-- exactly like createUser/deleteUser/setUserActiveState today).
create policy profiles_select on public.profiles
  for select using (id = auth.uid() or manager_id = auth.uid());

create policy profiles_self_update on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid());

-- customers / orders: owner or assigned driver (read-only for the driver).
create policy customers_select on public.customers
  for select using (owner_id = auth.uid() or public.fn_is_assigned_driver_for(owner_id, assigned_driver_id));

create policy customers_insert on public.customers
  for insert with check (owner_id = auth.uid());

create policy customers_update on public.customers
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy customers_delete on public.customers
  for delete using (owner_id = auth.uid());

create policy orders_select on public.orders
  for select using (owner_id = auth.uid() or public.fn_is_assigned_driver_for(owner_id, assigned_driver_id));

create policy orders_insert on public.orders
  for insert with check (owner_id = auth.uid());

create policy orders_update on public.orders
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy orders_delete on public.orders
  for delete using (owner_id = auth.uid());

-- order_items: no owner_id column, so policies join through the parent
-- order. select/delete intentionally include the assigned driver, matching
-- the asymmetry that already exists in the current Firestore rules
-- (drivers may read/delete items on orders assigned to them, but never
-- create/update them).
create policy order_items_select on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.owner_id = auth.uid() or public.fn_is_assigned_driver_for(o.owner_id, o.assigned_driver_id))
    )
  );

create policy order_items_delete on public.order_items
  for delete using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.owner_id = auth.uid() or public.fn_is_assigned_driver_for(o.owner_id, o.assigned_driver_id))
    )
  );

create policy order_items_insert on public.order_items
  for insert with check (
    exists (select 1 from public.orders o where o.id = order_id and o.owner_id = auth.uid())
  );

create policy order_items_update on public.order_items
  for update using (
    exists (select 1 from public.orders o where o.id = order_id and o.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.orders o where o.id = order_id and o.owner_id = auth.uid())
  );

-- products / countries / regions / cities: owner-only CRUD, zero driver
-- access (default-deny handles that automatically -- no driver policy).
create policy products_all on public.products
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy countries_all on public.countries
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy regions_all on public.regions
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy cities_all on public.cities
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- user_preferences: self only, no delete policy (matches "delete always
-- false" in the current Firestore rules).
create policy user_preferences_select on public.user_preferences
  for select using (id = auth.uid());

create policy user_preferences_insert on public.user_preferences
  for insert with check (id = auth.uid());

create policy user_preferences_update on public.user_preferences
  for update using (id = auth.uid()) with check (id = auth.uid());

-- driver_completion_stats: owner or the driver themself may read; only
-- the owner may write. No delete policy.
create policy driver_completion_stats_select on public.driver_completion_stats
  for select using (owner_id = auth.uid() or driver_id = auth.uid());

create policy driver_completion_stats_insert on public.driver_completion_stats
  for insert with check (owner_id = auth.uid());

create policy driver_completion_stats_update on public.driver_completion_stats
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- driver_check_ins: driver or manager may read. Driver creates their own
-- row (owner_id must match their real manager). Update visibility is
-- broad here -- the actual field-level enforcement lives in the
-- enforce_checkin_update() trigger above, since WITH CHECK can't compare
-- OLD vs NEW. No delete policy -- only the scheduled Edge Function
-- (service role) deletes.
create policy driver_check_ins_select on public.driver_check_ins
  for select using (driver_id = auth.uid() or owner_id = auth.uid());

create policy driver_check_ins_insert on public.driver_check_ins
  for insert with check (driver_id = auth.uid() and owner_id = public.fn_caller_manager_id());

create policy driver_check_ins_update on public.driver_check_ins
  for update using (driver_id = auth.uid() or owner_id = auth.uid());
