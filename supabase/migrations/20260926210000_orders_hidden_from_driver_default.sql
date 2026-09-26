-- Fix for 20260926190000: create_order_atomic (and any other
-- jsonb_populate_record-based insert) builds the orders row from a JSON
-- payload, and jsonb_populate_record fills every key the payload doesn't
-- carry with NULL -- the column DEFAULT never applies. With
-- hidden_from_driver NOT NULL, that made every new order fail
-- ("null value in column hidden_from_driver"). A new order is never hidden,
-- so fill the NULL in before the constraint is checked.

create function public.orders_default_hidden_from_driver()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.hidden_from_driver := coalesce(new.hidden_from_driver, false);
  return new;
end;
$$;

create trigger orders_default_hidden_from_driver
  before insert or update on public.orders
  for each row execute function public.orders_default_hidden_from_driver();
