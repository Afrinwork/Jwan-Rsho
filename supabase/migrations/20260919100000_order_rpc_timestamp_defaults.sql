-- Hardens create_order_atomic against a caller that forgets to include
-- created_at/updated_at in p_new_customer/p_order: jsonb_populate_record
-- against a null base record leaves any omitted column as NULL, it does
-- NOT fall back to the column's own `default now()` the way a plain
-- INSERT would -- discovered while writing tests/security-supabase.
-- Every real caller (orderRepository.createOrder) already supplies both
-- via withCreateTimestamps(), so this is defense in depth, not a fix for
-- an observed production bug.
create or replace function public.create_order_atomic(
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
  v_now timestamptz := now();
begin
  if exists (select 1 from public.orders where id = p_order_id) then
    raise exception 'order-already-exists' using errcode = 'P0001';
  end if;

  if p_new_customer is not null then
    insert into public.customers
    select * from jsonb_populate_record(
      null::public.customers,
      jsonb_build_object('created_at', v_now, 'updated_at', v_now) || p_new_customer
    );
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
    jsonb_build_object('created_at', v_now, 'updated_at', v_now)
      || p_order
      || jsonb_build_object('assigned_driver_id', v_assigned_driver_id)
  );

  if jsonb_array_length(p_items) > 0 then
    insert into public.order_items
    select * from jsonb_populate_recordset(null::public.order_items, p_items);
  end if;
end;
$$;
