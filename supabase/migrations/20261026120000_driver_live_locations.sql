-- A driver's last known position, for the managing admin/super_admin's
-- driver view -- independent of the daily status report (driver_check_ins).
-- One row per driver, overwritten by the driver's own app while the map is
-- open (source 'trip' once a trip is started, else 'app') and whenever the
-- app is opened ('app'). Completing a customer also stores that customer
-- as the last one visited (last_customer_*), kept apart so later position
-- updates don't wipe it. Readable by the driver and their manager (same
-- rule as route_orders), writable only by the driver themselves.

create table public.driver_live_locations (
  driver_id uuid primary key references public.profiles (id) on delete cascade,
  latitude double precision not null,
  longitude double precision not null,
  source text not null check (source in ('trip', 'app')),
  updated_at timestamptz not null default now(),
  last_customer_name text,
  last_customer_at timestamptz
);

alter table public.driver_live_locations enable row level security;

create policy driver_live_locations_select on public.driver_live_locations
  for select using ((select public.fn_can_manage_route_order(driver_id)));

create policy driver_live_locations_insert on public.driver_live_locations
  for insert with check (driver_id = (select auth.uid()));

create policy driver_live_locations_update on public.driver_live_locations
  for update using (driver_id = (select auth.uid()))
  with check (driver_id = (select auth.uid()));

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.driver_live_locations;
  end if;
end $$;
