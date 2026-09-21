-- Fixes the auth_rls_initplan advisor warnings from the initial schema
-- migration: wrap auth.uid()/helper-function calls in `(select ...)` so
-- Postgres evaluates them once per query instead of once per row.
-- https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select
-- Pure performance fix, no behavior change.

drop policy profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (id = (select auth.uid()) or manager_id = (select auth.uid()));

drop policy profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles
  for update using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy customers_select on public.customers;
create policy customers_select on public.customers
  for select using (owner_id = (select auth.uid()) or (select public.fn_is_assigned_driver_for(owner_id, assigned_driver_id)));

drop policy customers_insert on public.customers;
create policy customers_insert on public.customers
  for insert with check (owner_id = (select auth.uid()));

drop policy customers_update on public.customers;
create policy customers_update on public.customers
  for update using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

drop policy customers_delete on public.customers;
create policy customers_delete on public.customers
  for delete using (owner_id = (select auth.uid()));

drop policy orders_select on public.orders;
create policy orders_select on public.orders
  for select using (owner_id = (select auth.uid()) or (select public.fn_is_assigned_driver_for(owner_id, assigned_driver_id)));

drop policy orders_insert on public.orders;
create policy orders_insert on public.orders
  for insert with check (owner_id = (select auth.uid()));

drop policy orders_update on public.orders;
create policy orders_update on public.orders
  for update using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

drop policy orders_delete on public.orders;
create policy orders_delete on public.orders
  for delete using (owner_id = (select auth.uid()));

drop policy order_items_select on public.order_items;
create policy order_items_select on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.owner_id = (select auth.uid()) or (select public.fn_is_assigned_driver_for(o.owner_id, o.assigned_driver_id)))
    )
  );

drop policy order_items_delete on public.order_items;
create policy order_items_delete on public.order_items
  for delete using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.owner_id = (select auth.uid()) or (select public.fn_is_assigned_driver_for(o.owner_id, o.assigned_driver_id)))
    )
  );

drop policy order_items_insert on public.order_items;
create policy order_items_insert on public.order_items
  for insert with check (
    exists (select 1 from public.orders o where o.id = order_id and o.owner_id = (select auth.uid()))
  );

drop policy order_items_update on public.order_items;
create policy order_items_update on public.order_items
  for update using (
    exists (select 1 from public.orders o where o.id = order_id and o.owner_id = (select auth.uid()))
  ) with check (
    exists (select 1 from public.orders o where o.id = order_id and o.owner_id = (select auth.uid()))
  );

drop policy products_all on public.products;
create policy products_all on public.products
  for all using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

drop policy countries_all on public.countries;
create policy countries_all on public.countries
  for all using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

drop policy regions_all on public.regions;
create policy regions_all on public.regions
  for all using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

drop policy cities_all on public.cities;
create policy cities_all on public.cities
  for all using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

drop policy user_preferences_select on public.user_preferences;
create policy user_preferences_select on public.user_preferences
  for select using (id = (select auth.uid()));

drop policy user_preferences_insert on public.user_preferences;
create policy user_preferences_insert on public.user_preferences
  for insert with check (id = (select auth.uid()));

drop policy user_preferences_update on public.user_preferences;
create policy user_preferences_update on public.user_preferences
  for update using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy driver_completion_stats_select on public.driver_completion_stats;
create policy driver_completion_stats_select on public.driver_completion_stats
  for select using (owner_id = (select auth.uid()) or driver_id = (select auth.uid()));

drop policy driver_completion_stats_insert on public.driver_completion_stats;
create policy driver_completion_stats_insert on public.driver_completion_stats
  for insert with check (owner_id = (select auth.uid()));

drop policy driver_completion_stats_update on public.driver_completion_stats;
create policy driver_completion_stats_update on public.driver_completion_stats
  for update using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

drop policy driver_check_ins_select on public.driver_check_ins;
create policy driver_check_ins_select on public.driver_check_ins
  for select using (driver_id = (select auth.uid()) or owner_id = (select auth.uid()));

drop policy driver_check_ins_insert on public.driver_check_ins;
create policy driver_check_ins_insert on public.driver_check_ins
  for insert with check (driver_id = (select auth.uid()) and owner_id = (select public.fn_caller_manager_id()));

drop policy driver_check_ins_update on public.driver_check_ins;
create policy driver_check_ins_update on public.driver_check_ins
  for update using (driver_id = (select auth.uid()) or owner_id = (select auth.uid()));

drop policy driver_check_ins_storage_select on storage.objects;
create policy driver_check_ins_storage_select on storage.objects
  for select using (
    bucket_id = 'driver-check-ins'
    and (
      (select auth.uid())::text = (storage.foldername(name))[2]
      or (select auth.uid())::text = (storage.foldername(name))[1]
    )
  );

drop policy driver_check_ins_storage_insert on storage.objects;
create policy driver_check_ins_storage_insert on storage.objects
  for insert with check (
    bucket_id = 'driver-check-ins'
    and (storage.foldername(name))[2] = (select auth.uid())::text
    and (storage.foldername(name))[1] = (select public.fn_caller_manager_id())::text
  );
