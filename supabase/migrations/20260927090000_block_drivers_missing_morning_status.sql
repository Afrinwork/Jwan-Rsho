-- Replaces functions/src/admin/blockDriversMissingMorningStatus.ts (Firebase,
-- daily 10:00 Europe/Berlin): every active driver without a COMPLETE morning
-- report for today (status 'ok' + an address + an odometer reading) is
-- blocked — today's check-in marked 'blocked' / 'no_response_by_10', the
-- profile deactivated, the login banned and all sessions revoked. Runs on
-- the server so closing the app or changing the phone's clock can't dodge
-- it. An admin re-activates the driver exactly as before
-- (set-user-active-state: is_active = true + ban lifted).
--
-- Plain SQL via pg_cron (no Edge Function needed). Scheduled hourly and
-- only acts in the 10:00 Berlin hour, so it stays at 10:00 local time
-- across summer/winter time without editing the cron expression.

create function public.block_drivers_missing_morning_status(p_force boolean default false)
returns integer
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_now timestamptz := now();
  v_today text := to_char(v_now at time zone 'Europe/Berlin', 'YYYY-MM-DD');
  v_driver record;
  v_blocked integer := 0;
begin
  if not p_force and extract(hour from v_now at time zone 'Europe/Berlin') <> 10 then
    return 0;
  end if;

  for v_driver in
    select p.id, p.manager_id
    from public.profiles p
    where p.role = 'driver'
      and coalesce(p.is_active, true)
      and p.manager_id is not null
      and not exists (
        select 1 from public.driver_check_ins c
        where c.driver_id = p.id
          and c.date = v_today
          and c.status = 'ok'
          and nullif(trim(c.address), '') is not null
          and c.odometer_km is not null
      )
  loop
    insert into public.driver_check_ins (driver_id, date, owner_id, status, blocked_reason, attempts, created_at, updated_at)
    values (v_driver.id, v_today, v_driver.manager_id, 'blocked', 'no_response_by_10', 0, v_now, v_now)
    on conflict (driver_id, date) do update
      set status = 'blocked', blocked_reason = 'no_response_by_10', updated_at = v_now;

    update public.profiles set is_active = false, updated_at = v_now where id = v_driver.id;

    -- Same effect as set-user-active-state's ban_duration '876000h' plus
    -- Firebase's revokeRefreshTokens: no new logins, existing sessions end.
    update auth.users set banned_until = v_now + interval '876000 hours' where id = v_driver.id;
    delete from auth.sessions where user_id = v_driver.id;

    v_blocked := v_blocked + 1;
  end loop;

  return v_blocked;
end;
$$;

-- Server-side only: never callable from the app.
revoke all on function public.block_drivers_missing_morning_status(boolean) from public, anon, authenticated;

select cron.schedule(
  'block-drivers-missing-morning-status',
  '0 * * * *',
  $$ select public.block_drivers_missing_morning_status(); $$
);
