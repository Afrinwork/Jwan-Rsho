import { getAdminClient, jsonResponse } from "../_shared/auth.ts";
import { getBerlinDateKeyDaysAgo } from "../_shared/europeBerlin.ts";

// Replaces functions/src/admin/cleanupExpiredCheckIns.ts. Invoked on a
// schedule (see supabase/migrations for the pg_cron job) with the
// service-role key as its own Authorization header -- not a caller-facing
// function, no requireX() guard.
//
// Storage object deleted BEFORE the row, matching the Firebase version:
// if this is interrupted mid-run, at worst a row survives with no photo
// (caught by the next run), never a photo with no row referencing it.
Deno.serve(async (_req) => {
  const admin = getAdminClient();
  const cutoff = getBerlinDateKeyDaysAgo(3);

  const { data: expired, error: selectError } = await admin
    .from("driver_check_ins")
    .select("driver_id, date, photo_storage_path")
    .lt("date", cutoff);

  if (selectError) {
    console.error(selectError);
    return jsonResponse({ error: "internal" }, 500);
  }

  let deletedRows = 0;
  let deletedPhotos = 0;

  for (const row of expired ?? []) {
    if (row.photo_storage_path) {
      const { error: storageError } = await admin.storage
        .from("driver-check-ins")
        .remove([row.photo_storage_path]);
      if (!storageError) deletedPhotos += 1;
      else console.error("Failed to delete check-in photo", row.photo_storage_path, storageError);
    }

    const { error: deleteError } = await admin
      .from("driver_check_ins")
      .delete()
      .eq("driver_id", row.driver_id)
      .eq("date", row.date);
    if (!deleteError) deletedRows += 1;
    else console.error("Failed to delete check-in row", row.driver_id, row.date, deleteError);
  }

  return jsonResponse({ cutoff, deletedRows, deletedPhotos });
});
