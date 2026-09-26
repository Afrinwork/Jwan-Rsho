-- Enables the driver's Add screen without widening access to another
-- manager or another driver's records. Drivers may create only records
-- assigned to themselves under their manager; later edits remain owner-only.

create or replace function public.fn_is_active_driver_for_owner(p_owner_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role = 'driver'
      and coalesce(p.is_active, true)
      and p.manager_id = p_owner_id
  );
$$;

drop policy customers_insert on public.customers;
create policy customers_insert on public.customers
  for insert with check (
    owner_id = (select auth.uid())
    or (
      (select public.fn_is_active_driver_for_owner(owner_id))
      and assigned_driver_id = (select auth.uid())
    )
  );

drop policy orders_insert on public.orders;
create policy orders_insert on public.orders
  for insert with check (
    owner_id = (select auth.uid())
    or (
      (select public.fn_is_active_driver_for_owner(owner_id))
      and assigned_driver_id = (select auth.uid())
      and exists (
        select 1 from public.customers c
        -- Qualified on purpose: an unqualified owner_id inside this
        -- subquery resolves to c.owner_id, which made the check always true.
        where c.id = orders.customer_id
          and c.owner_id = orders.owner_id
          and c.assigned_driver_id = (select auth.uid())
      )
    )
  );

drop policy order_items_insert on public.order_items;
create policy order_items_insert on public.order_items
  for insert with check (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (
          o.owner_id = (select auth.uid())
          or (
            (select public.fn_is_active_driver_for_owner(o.owner_id))
            and o.assigned_driver_id = (select auth.uid())
          )
        )
    )
  );

create policy products_driver_select on public.products
  for select using ((select public.fn_is_active_driver_for_owner(owner_id)));

create policy countries_driver_select on public.countries
  for select using ((select public.fn_is_active_driver_for_owner(owner_id)));
