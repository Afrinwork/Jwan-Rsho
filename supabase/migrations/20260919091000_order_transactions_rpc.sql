-- Replaces orderRepository.createOrder's Firestore runTransaction and
-- updateOpenOrderCustomerAndItems's writeBatch. Both need multiple tables
-- to change together atomically; PostgREST has no client-side multi-table
-- transaction, so each becomes one plpgsql function call instead.
--
-- security invoker (not definer) throughout: every insert/update inside
-- still runs as the calling user, so the existing customers/orders/
-- order_items RLS policies are the real enforcement -- these functions
-- only add atomicity, not privilege.
--
-- jsonb_populate_record/jsonb_populate_recordset let the row shape be
-- built once in JS (reusing the existing buildOrderCreateData /
-- buildOrderItemData / buildNewCustomerForOrder validators, already
-- snake_cased) and passed straight through, instead of duplicating that
-- business logic in SQL.

create function public.create_order_atomic(
  p_order_id text,
  p_customer_id text,
  p_new_customer jsonb,
  p_order jsonb,
  p_items jsonb
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_assigned_driver_id uuid;
begin
  if exists (select 1 from public.orders where id = p_order_id) then
    raise exception 'order-already-exists' using errcode = 'P0001';
  end if;

  if p_new_customer is not null then
    insert into public.customers
    select * from jsonb_populate_record(null::public.customers, p_new_customer);
  else
    if not exists (select 1 from public.customers where id = p_customer_id) then
      raise exception 'customer-not-found' using errcode = 'P0002';
    end if;
  end if;

  select assigned_driver_id into v_assigned_driver_id
  from public.customers where id = p_customer_id;

  insert into public.orders
  select * from jsonb_populate_record(
    null::public.orders,
    p_order || jsonb_build_object('assigned_driver_id', v_assigned_driver_id)
  );

  if jsonb_array_length(p_items) > 0 then
    insert into public.order_items
    select * from jsonb_populate_recordset(null::public.order_items, p_items);
  end if;
end;
$$;

revoke all on function public.create_order_atomic(text, text, jsonb, jsonb, jsonb) from public;
grant execute on function public.create_order_atomic(text, text, jsonb, jsonb, jsonb) to authenticated;

create function public.update_open_order_customer_and_items(
  p_order_id text,
  p_customer_id text,
  p_customer_patch jsonb,
  p_order_patch jsonb,
  p_items jsonb
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.orders
    where id = p_order_id and customer_id = p_customer_id and status = 'open'
  ) then
    raise exception 'order-not-found' using errcode = 'P0002';
  end if;

  update public.customers
  set full_name = merged.full_name,
      phone = merged.phone,
      address = merged.address,
      city = merged.city,
      normalized_city = merged.normalized_city,
      country = merged.country,
      region = merged.region,
      latitude = merged.latitude,
      longitude = merged.longitude,
      location_status = merged.location_status,
      note = merged.note,
      assigned_driver_id = merged.assigned_driver_id,
      is_active = merged.is_active,
      updated_at = now()
  from (
    select (jsonb_populate_record(t, p_customer_patch)).*
    from public.customers t
    where t.id = p_customer_id
  ) as merged
  where public.customers.id = p_customer_id;

  if p_order_patch ? 'assigned_driver_id' then
    update public.orders
    set assigned_driver_id = (p_order_patch->>'assigned_driver_id')::uuid,
        updated_at = now()
    where id = p_order_id;
  else
    update public.orders set updated_at = now() where id = p_order_id;
  end if;

  delete from public.order_items where order_id = p_order_id;

  if jsonb_array_length(p_items) > 0 then
    insert into public.order_items
    select * from jsonb_populate_recordset(null::public.order_items, p_items);
  end if;
end;
$$;

revoke all on function public.update_open_order_customer_and_items(text, text, jsonb, jsonb, jsonb) from public;
grant execute on function public.update_open_order_customer_and_items(text, text, jsonb, jsonb, jsonb) to authenticated;
