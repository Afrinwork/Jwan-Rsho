-- Every live screen in the app (a driver's open orders/route, the driver
-- dashboard, check-ins, the shared stop order) listens via Realtime
-- postgres_changes -- but none of these tables were ever added to the
-- supabase_realtime publication, so those subscriptions only ever got the
-- initial fetch and never a live update. RLS still applies to what each
-- subscriber receives. Guarded so it can run on any database state.

do $$
declare
  t text;
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    return;
  end if;

  foreach t in array array['orders', 'driver_check_ins', 'driver_completion_stats', 'route_orders'] loop
    if to_regclass('public.' || t) is not null
      and not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
      ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
