-- Lets the assigned driver complete an order. orders_update is owner-only,
-- so a driver's plain UPDATE silently matched 0 rows: the stop vanished
-- from the driver's own trip, but the order stayed "open" in the database
-- and so stayed on the admin's map. This RPC allows exactly that one
-- transition (open -> completed) for the owner or the order's assigned,
-- active driver -- every other order edit remains owner-only.
--
-- It also keeps the completed history bounded: once the owner has 200
-- completed orders, the oldest 100 (by completed_at) are deleted for good
-- (items go with them via ON DELETE CASCADE).
create or replace function public.complete_order(p_order_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid;
  v_driver_id uuid;
  v_status text;
  v_completed_count integer;
begin
  select owner_id, assigned_driver_id, status
    into v_owner_id, v_driver_id, v_status
    from public.orders
    where id = p_order_id
    for update;

  if v_owner_id is null then
    raise exception 'order-not-found';
  end if;

  if not (
    v_owner_id = auth.uid()
    or (v_driver_id = auth.uid() and public.fn_is_active_driver_for_owner(v_owner_id))
  ) then
    raise exception 'not-allowed';
  end if;

  -- Completing twice (double tap, retry) is a no-op, not an error.
  if v_status = 'completed' then
    return;
  end if;

  if v_status <> 'open' then
    raise exception 'order-not-open';
  end if;

  update public.orders
    set status = 'completed', completed_at = now(), updated_at = now()
    where id = p_order_id;

  select count(*) into v_completed_count
    from public.orders
    where owner_id = v_owner_id and status = 'completed';

  if v_completed_count >= 200 then
    delete from public.orders
      where id in (
        select id from public.orders
          where owner_id = v_owner_id and status = 'completed'
          order by completed_at asc
          limit 100
      );
  end if;
end;
$$;

revoke all on function public.complete_order(text) from public;
grant execute on function public.complete_order(text) to authenticated;
