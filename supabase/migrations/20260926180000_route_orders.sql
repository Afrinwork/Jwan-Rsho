-- Each person's own saved stop order ("their list"): one row per user,
-- driver or admin/super_admin alike. Readable/writable by the user
-- themselves and by the admin/super_admin who manages them (their
-- profiles.manager_id), so a manager can re-sort a driver's list from the
-- driver view and the driver picks it up live -- and vice versa. Nobody
-- else can see or touch it. Mirrors firebase/firestore.rules /routeOrders.

create table public.route_orders (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  customer_ids text[] not null default '{}',
  updated_by uuid not null references public.profiles (id) on delete cascade,
  updated_at timestamptz not null default now(),
  constraint route_orders_size check (coalesce(array_length(customer_ids, 1), 0) <= 2000)
);

create function public.fn_can_manage_route_order(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_user_id = auth.uid()
    or (
      public.fn_caller_role() in ('admin', 'super_admin')
      and exists (select 1 from public.profiles p where p.id = p_user_id and p.manager_id = auth.uid())
    );
$$;

alter table public.route_orders enable row level security;

create policy route_orders_select on public.route_orders
  for select using ((select public.fn_can_manage_route_order(user_id)));

create policy route_orders_insert on public.route_orders
  for insert with check ((select public.fn_can_manage_route_order(user_id)) and updated_by = (select auth.uid()));

create policy route_orders_update on public.route_orders
  for update using ((select public.fn_can_manage_route_order(user_id)))
  with check ((select public.fn_can_manage_route_order(user_id)) and updated_by = (select auth.uid()));

create policy route_orders_delete on public.route_orders
  for delete using ((select public.fn_can_manage_route_order(user_id)));

-- Live updates for the other side (driver <-> manager). Guarded so the
-- migration still applies where the publication doesn't exist.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.route_orders;
  end if;
end $$;
