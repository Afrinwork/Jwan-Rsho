-- The driver's daily report (address + odometer) is optional now: a driver
-- who hasn't sent it by 10:00 Berlin time is no longer blocked. Removes the
-- hourly job and the function from 20260927090000. Drivers it already
-- blocked stay blocked until an admin re-activates them as before
-- (set-user-active-state).

select cron.unschedule('block-drivers-missing-morning-status');

drop function public.block_drivers_missing_morning_status(boolean);
