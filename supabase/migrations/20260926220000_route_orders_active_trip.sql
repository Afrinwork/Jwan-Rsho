-- The driver's trip in progress (RouteLiveScreen), mirrored next to their
-- saved list so the managing admin/super_admin can see it live in the
-- driver view: the stops in the order the driver is driving them, and
-- which one is next. Written by the driver's app while the trip screen is
-- open, cleared when they leave it. Same RLS as the rest of the row
-- (the user themselves + their manager), same realtime publication.

alter table public.route_orders
  add column trip_customer_ids text[],
  add column trip_current_customer_id text,
  add column trip_updated_at timestamptz;
