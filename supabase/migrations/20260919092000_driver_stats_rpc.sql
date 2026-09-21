-- Replaces driverStatsRepository.recordCompletion's Firestore
-- runTransaction (get-or-init + increment, self-resetting whenever the
-- stored date isn't today -- exactly one row per driver, no cleanup job
-- needed). An INSERT ... ON CONFLICT can't express the "same day ?
-- increment : reset to 1" branch on its own, so this is a small RPC
-- instead of a plain upsert call.
create function public.record_driver_completion(p_driver_id uuid, p_owner_id uuid, p_date text)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  insert into public.driver_completion_stats (driver_id, owner_id, date, count, updated_at)
  values (p_driver_id, p_owner_id, p_date, 1, now())
  on conflict (driver_id) do update
  set count = case
        when public.driver_completion_stats.date = excluded.date
          then public.driver_completion_stats.count + 1
          else 1
        end,
      date = excluded.date,
      owner_id = excluded.owner_id,
      updated_at = now();
end;
$$;

revoke all on function public.record_driver_completion(uuid, uuid, text) from public;
grant execute on function public.record_driver_completion(uuid, uuid, text) to authenticated;
