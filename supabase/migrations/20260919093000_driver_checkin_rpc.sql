-- Replaces driverCheckInRepository.recordAttemptFailure and
-- submitCheckIn's Firestore runTransaction (get-or-init + update,
-- self-resetting per day). The composite (driver_id, date) primary key
-- already makes "today's row" unambiguous -- a different day is a
-- different key, not a conflict -- so a plain INSERT ... ON CONFLICT
-- DO UPDATE covers what the Firestore transaction needed, no explicit
-- read-then-branch required. The 3-attempt block threshold + the
-- trigger from the initial schema migration (a driver can't overwrite
-- an admin_blocked reason) still apply exactly as before, since this
-- still runs as the calling driver (security invoker).
create function public.record_checkin_attempt_failure(p_driver_id uuid, p_owner_id uuid, p_date text)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  -- blocked_reason is always explicitly assigned (never left untouched)
  -- on the conflict path, mirroring the Firestore version's non-merge
  -- .set() -- which fully replaced the document, so blockedReason was
  -- always either the new "max_attempts" or entirely absent. That means
  -- the enforce_checkin_update trigger correctly sees a real change and
  -- rejects the whole call if the row was admin_blocked, instead of the
  -- CASE expression silently leaving a stale admin_blocked reason next
  -- to a status that no longer says "blocked".
  insert into public.driver_check_ins (driver_id, date, owner_id, status, attempts, blocked_reason, created_at, updated_at)
  values (p_driver_id, p_date, p_owner_id, 'pending', 1, null, now(), now())
  on conflict (driver_id, date) do update
  set attempts = public.driver_check_ins.attempts + 1,
      status = case when public.driver_check_ins.attempts + 1 >= 3 then 'blocked' else 'pending' end,
      blocked_reason = case when public.driver_check_ins.attempts + 1 >= 3 then 'max_attempts' else null end,
      updated_at = now();
end;
$$;

revoke all on function public.record_checkin_attempt_failure(uuid, uuid, text) from public;
grant execute on function public.record_checkin_attempt_failure(uuid, uuid, text) to authenticated;

create function public.submit_checkin(
  p_driver_id uuid,
  p_owner_id uuid,
  p_date text,
  p_address text,
  p_latitude double precision,
  p_longitude double precision,
  p_gps_accuracy double precision,
  p_odometer_km numeric,
  p_photo_storage_path text
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  -- blocked_reason is explicitly set to NULL on both paths (matching the
  -- Firestore version's non-merge .set(), which dropped the field
  -- entirely) so that if the row was admin_blocked, the
  -- enforce_checkin_update trigger sees blocked_reason actually change
  -- and rejects the whole call -- a driver must stay blocked until an
  -- admin clears it, even if they submit a fully valid check-in.
  insert into public.driver_check_ins (
    driver_id, date, owner_id, status, attempts, blocked_reason, address, latitude, longitude,
    gps_accuracy, odometer_km, photo_storage_path, completed_at, created_at, updated_at
  )
  values (
    p_driver_id, p_date, p_owner_id, 'ok', 0, null, p_address, p_latitude, p_longitude,
    p_gps_accuracy, p_odometer_km, p_photo_storage_path, now(), now(), now()
  )
  on conflict (driver_id, date) do update
  set status = 'ok',
      blocked_reason = null,
      address = p_address,
      latitude = p_latitude,
      longitude = p_longitude,
      gps_accuracy = p_gps_accuracy,
      odometer_km = p_odometer_km,
      photo_storage_path = p_photo_storage_path,
      completed_at = now(),
      updated_at = now();
end;
$$;

revoke all on function public.submit_checkin(uuid, uuid, text, text, double precision, double precision, double precision, numeric, text) from public;
grant execute on function public.submit_checkin(uuid, uuid, text, text, double precision, double precision, double precision, numeric, text) to authenticated;
