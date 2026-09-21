-- Schedules the cleanup-expired-check-ins Edge Function daily via
-- pg_cron + pg_net, matching the Firebase onSchedule("every day 03:00")
-- cadence. The service-role key used to call the function is looked up
-- from Supabase Vault by name (`cleanup_function_service_role_key`) --
-- deliberately NOT embedded in this migration file, since migrations are
-- committed to git. The secret itself is inserted separately via a
-- one-off `select vault.create_secret(...)` call, not part of this
-- migration.

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

select cron.schedule(
  'cleanup-expired-check-ins-daily',
  '0 3 * * *',
  $$
  select net.http_post(
    url := 'https://hkpobxhuyyogtlforzsg.supabase.co/functions/v1/cleanup-expired-check-ins',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        select decrypted_secret from vault.decrypted_secrets
        where name = 'cleanup_function_service_role_key'
      )
    ),
    body := '{}'::jsonb
  );
  $$
);
