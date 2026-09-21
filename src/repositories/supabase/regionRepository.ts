import { AppError } from "@/src/errors/AppError";
import { errorMessages } from "@/src/errors/errorMessages";
import { buildRegionCreateData, buildRegionUpdateData, RegionWrite } from "@/src/repositories/regionRepositoryData";
import { toCamelCase, toSnakeCase } from "@/src/repositories/supabase/caseMapping";
import { requireCurrentUserId, requireSupabase } from "@/src/repositories/supabase/repositoryContext";
import { Region } from "@/src/types/region";
import type { Database } from "@/src/types/supabase";
import { generateUuid } from "@/src/utils/uuid";

type RegionInsert = Database["public"]["Tables"]["regions"]["Insert"];

export const regionRepository = {
  async createRegion(input: RegionWrite) {
    const ownerId = requireCurrentUserId();
    await ensureUniqueRegion(input, ownerId);
    const id = generateUuid();
    const timestamp = new Date().toISOString();
    const { error } = await requireSupabase()
      .from("regions")
      .insert({
        ...toSnakeCase(buildRegionCreateData(input, ownerId)),
        id,
        created_at: timestamp,
        updated_at: timestamp,
      } as RegionInsert);
    if (error) throw error;
    return id;
  },

  async updateRegion(id: string, input: Partial<RegionWrite>) {
    const region = await getOwnedRegion(id);
    await ensureUniqueRegion(
      {
        name: input.name ?? region.name,
        country: input.country ?? region.country,
        city: input.city ?? region.city,
      },
      region.ownerId,
      id,
    );
    const { error } = await requireSupabase()
      .from("regions")
      .update({ ...toSnakeCase(buildRegionUpdateData(input)), updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  },

  async getRegions() {
    const ownerId = requireCurrentUserId();
    const { data, error } = await requireSupabase().from("regions").select("*").eq("owner_id", ownerId);
    if (error) throw error;
    return sortRegions((data ?? []).map((row) => toCamelCase<Region>(row)));
  },

  async deleteRegion(id: string) {
    const region = await getOwnedRegion(id);
    const { count, error: countError } = await requireSupabase()
      .from("customers")
      .select("*", { count: "exact", head: true })
      .eq("owner_id", region.ownerId)
      .eq("country", region.country)
      .eq("region", region.name);
    if (countError) throw countError;

    if ((count ?? 0) > 0) {
      throw new AppError(errorMessages.regionInUse);
    }

    const { error } = await requireSupabase().from("regions").delete().eq("id", id);
    if (error) throw error;
  },
};

async function ensureUniqueRegion(input: Pick<RegionWrite, "name" | "country" | "city">, ownerId: string, excludeId?: string) {
  const { data, error } = await requireSupabase()
    .from("regions")
    .select("id, normalized_city")
    .eq("owner_id", ownerId)
    .eq("normalized_name", input.name.trim().toLowerCase())
    .eq("normalized_country", input.country.trim().toLowerCase());
  if (error) throw error;

  const normalizedCity = input.city?.trim().toLowerCase() ?? "";
  const hasDuplicate = (data ?? []).some((value) => {
    if (value.id === excludeId) return false;
    return (value.normalized_city ?? "") === normalizedCity;
  });

  if (hasDuplicate) {
    throw new AppError(errorMessages.duplicateRegion);
  }
}

async function getOwnedRegion(id: string): Promise<Region> {
  const { data, error } = await requireSupabase().from("regions").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Region not found.");
  return toCamelCase<Region>(data);
}

function sortRegions(regions: Region[]) {
  return [...regions].sort((left, right) => {
    const countryCompare = left.country.localeCompare(right.country, "de");
    if (countryCompare !== 0) return countryCompare;
    return left.name.localeCompare(right.name, "de");
  });
}
