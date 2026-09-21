-- Replaces the Firebase getActiveUserCount Cloud Function. Pure SQL +
-- an authorization check, no Auth Admin API needed, so this is a plain
-- Postgres RPC instead of an Edge Function (avoids paying Edge Function
-- cold-start latency for something this simple).
create function public.get_active_user_count()
returns integer
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if public.fn_caller_role() not in ('admin', 'super_admin') then
    raise exception 'permission-denied' using errcode = '42501';
  end if;
  return (select count(*)::integer from public.profiles where is_active);
end;
$$;

revoke all on function public.get_active_user_count() from public;
grant execute on function public.get_active_user_count() to authenticated;
