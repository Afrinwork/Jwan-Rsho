-- The person's own trip on the map (useMapTrip), synced between every
-- phone signed in to the same account: a trip started on one phone shows
-- up on the others, and "add to trip" on the order form works from any of
-- them. Holds the same JSON the app keeps on the device
-- (activeTripStorage) plus the id of the device that wrote it. Same RLS
-- and realtime publication as the rest of the row.

alter table public.route_orders
  add column trip_state jsonb;

-- "Add to trip" from any phone: appends the customer to the running trip's
-- scope in one statement, so two additions at once can't overwrite each
-- other. Only a started trip narrowed to a selection needs it -- a trip
-- over every customer takes new ones in anyway. Security invoker: RLS
-- limits it to the caller's own row.
create or replace function public.add_customer_to_trip(p_customer_id text)
returns void
language sql
security invoker
set search_path = public
as $$
  update public.route_orders
  set trip_state = trip_state || jsonb_build_object(
        'scopeIds', (trip_state -> 'scopeIds') || to_jsonb(p_customer_id),
        'savedAt', to_jsonb(now()),
        'deviceId', 'server'
      ),
      updated_by = auth.uid(),
      updated_at = now()
  where user_id = auth.uid()
    and (trip_state ->> 'started')::boolean is true
    and jsonb_typeof(trip_state -> 'scopeIds') = 'array'
    and not (trip_state -> 'scopeIds') ? p_customer_id;
$$;

grant execute on function public.add_customer_to_trip(text) to authenticated;
