-- Replaces customerRepository.assignDriver's Firestore writeBatch (which
-- was atomic). PostgREST has no multi-table atomic write from the client
-- directly, so this wraps both updates (the customer + all of its
-- currently open orders) in one server-side transaction instead --
-- otherwise a mid-way failure could leave the customer's driver changed
-- but its open orders still pointing at the old one.
--
-- security invoker (not definer): runs with the CALLING user's own
-- permissions, so the existing customers/orders RLS policies still apply
-- exactly as if the two updates had been issued directly by the client.
-- This is a atomicity wrapper, not a privilege escalation.
create function public.assign_customer_driver(p_customer_id text, p_driver_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  update public.customers
  set assigned_driver_id = p_driver_id, updated_at = now()
  where id = p_customer_id;

  if not found then
    raise exception 'not-found' using errcode = 'P0002';
  end if;

  update public.orders
  set assigned_driver_id = p_driver_id, updated_at = now()
  where customer_id = p_customer_id and status = 'open';
end;
$$;

revoke all on function public.assign_customer_driver(text, uuid) from public;
grant execute on function public.assign_customer_driver(text, uuid) to authenticated;
