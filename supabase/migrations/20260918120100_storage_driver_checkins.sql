-- Stage 1 (storage part): driver check-in odometer photos.
-- Path convention: {owner_id}/{driver_id}/{fileName} inside the
-- `driver-check-ins` bucket (mirrors firebase/storage.rules'
-- driverCheckIns/{ownerId}/{driverId}/{fileName}).
--
-- Deliberate improvement over the current Firebase Storage rule: that
-- rule cannot reliably cross-check that {ownerId} in the path is really
-- the uploading driver's actual manager, because Firestore Storage rules
-- calling firestore.get() didn't work reliably (documented, accepted gap
-- in firebase/storage.rules). Here, Storage RLS runs in the same
-- database as `profiles`, so this gets closed for real via
-- fn_caller_manager_id().

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('driver-check-ins', 'driver-check-ins', false, 8388608, array['image/jpeg', 'image/png', 'image/webp']);

create policy driver_check_ins_storage_select on storage.objects
  for select using (
    bucket_id = 'driver-check-ins'
    and (
      auth.uid()::text = (storage.foldername(name))[2]
      or auth.uid()::text = (storage.foldername(name))[1]
    )
  );

create policy driver_check_ins_storage_insert on storage.objects
  for insert with check (
    bucket_id = 'driver-check-ins'
    and (storage.foldername(name))[2] = auth.uid()::text
    and (storage.foldername(name))[1] = public.fn_caller_manager_id()::text
  );

-- No update/delete policy: only the scheduled cleanup Edge Function
-- (service role, bypasses RLS) deletes -- matches "delete always false"
-- in the current Firebase Storage rule.
