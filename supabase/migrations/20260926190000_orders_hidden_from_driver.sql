-- Lets the owning admin/super_admin take an assigned open order off the
-- driver's map/route for now -- without deleting or unassigning it (e.g.
-- "only Hannover today, hide Berlin"). Driver-scoped reads filter on it;
-- only the owner can change it (orders_update is already owner-only), and
-- the driver's existing orders realtime subscription picks changes up live.

alter table public.orders
  add column hidden_from_driver boolean not null default false;

create index orders_driver_visible_open_idx
  on public.orders (owner_id, assigned_driver_id, status, hidden_from_driver);
