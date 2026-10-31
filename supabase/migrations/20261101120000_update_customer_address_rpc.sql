-- Lets the trip's customer list (pencil next to each stop) correct a
-- customer's address mid-drive -- for the owner and also for the customer's
-- assigned, active driver. customers_update stays owner-only; this RPC
-- allows exactly the address fields and their coordinates, nothing else.
--
-- It also touches the customer's open orders: every map reloads on order
-- changes (realtime on orders), so the moved stop shows up live on every
-- phone running the trip -- the driver's, the admin's, the account's other
-- phones.
create or replace function public.update_customer_address(
  p_customer_id text,
  p_address text,
  p_city text,
  p_normalized_city text,
  p_country text,
  p_latitude double precision,
  p_longitude double precision
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid;
  v_driver_id uuid;
begin
  select owner_id, assigned_driver_id
    into v_owner_id, v_driver_id
    from public.customers
    where id = p_customer_id
    for update;

  if v_owner_id is null then
    raise exception 'customer-not-found';
  end if;

  if not (
    v_owner_id = auth.uid()
    or (v_driver_id = auth.uid() and public.fn_is_active_driver_for_owner(v_owner_id))
  ) then
    raise exception 'not-allowed';
  end if;

  update public.customers
  set address = p_address,
      city = p_city,
      normalized_city = p_normalized_city,
      country = p_country,
      latitude = p_latitude,
      longitude = p_longitude,
      location_status = 'ok',
      updated_at = now()
  where id = p_customer_id;

  update public.orders
  set updated_at = now()
  where customer_id = p_customer_id
    and status = 'open';
end;
$$;

grant execute on function public.update_customer_address(text, text, text, text, text, double precision, double precision) to authenticated;
