import { AppError } from "@/src/errors/AppError";
import { errorMessages } from "@/src/errors/errorMessages";
import { buildCityCreateData, buildCityUpdateData, CityWrite } from "@/src/repositories/cityRepositoryData";
import { toCamelCase, toSnakeCase } from "@/src/repositories/supabase/caseMapping";
import { requireCurrentUserId, requireSupabase } from "@/src/repositories/supabase/repositoryContext";
import { City } from "@/src/types/city";
import type { Database } from "@/src/types/supabase";
import { generateUuid } from "@/src/utils/uuid";

type CityInsert = Database["public"]["Tables"]["cities"]["Insert"];

export const cityRepository = {
  async getCities() {
    const ownerId = requireCurrentUserId();
    const { data, error } = await requireSupabase().from("cities").select("*").eq("owner_id", ownerId);
    if (error) throw error;
    return sortCities((data ?? []).map((row) => toCamelCase<City>(row)));
  },

  async getCityByNormalizedName(normalizedName: string) {
    const ownerId = requireCurrentUserId();
    const { data, error } = await requireSupabase()
      .from("cities")
      .select("*")
      .eq("owner_id", ownerId)
      .eq("normalized_name", normalizedName)
      .maybeSingle();
    if (error) throw error;
    return data ? toCamelCase<City>(data) : null;
  },

  async updateCity(id: string, input: Partial<CityWrite>) {
    await getOwnedCity(id);
    const { error } = await requireSupabase()
      .from("cities")
      .update({ ...toSnakeCase(buildCityUpdateData(input)), updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  },

  async deleteCity(id: string) {
    const city = await getOwnedCity(id);
    const { count, error: countError } = await requireSupabase()
      .from("customers")
      .select("*", { count: "exact", head: true })
      .eq("owner_id", city.ownerId)
      .eq("normalized_city", city.normalizedName);
    if (countError) throw countError;

    if ((count ?? 0) > 0) {
      throw new AppError(errorMessages.cityInUse);
    }

    const { error } = await requireSupabase().from("cities").delete().eq("id", id);
    if (error) throw error;
  },

  // Cities have no manual "add" form -- a city entity is created
  // automatically the first time it's used on a customer (see
  // customerRepository), and from then on persists independently, even
  // once no customers reference it.
  async ensureCityExists(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;

    const ownerId = requireCurrentUserId();
    const normalizedName = trimmed.toLowerCase();
    const client = requireSupabase();
    const { data: existing, error: existingError } = await client
      .from("cities")
      .select("id")
      .eq("owner_id", ownerId)
      .eq("normalized_name", normalizedName)
      .maybeSingle();
    if (existingError) throw existingError;
    if (existing) return;

    const timestamp = new Date().toISOString();
    const { error } = await client.from("cities").insert({
      ...toSnakeCase(buildCityCreateData({ name: trimmed }, ownerId)),
      id: generateUuid(),
      created_at: timestamp,
      updated_at: timestamp,
    } as CityInsert);
    if (error) throw error;
  },

  // Renames the city entity for the given normalized name -- creates one
  // if it doesn't exist yet (e.g. legacy customers from before cities
  // were tracked).
  async renameCityEntity(currentNormalizedName: string, newName: string) {
    const ownerId = requireCurrentUserId();
    const client = requireSupabase();
    const { data: existing, error: existingError } = await client
      .from("cities")
      .select("id")
      .eq("owner_id", ownerId)
      .eq("normalized_name", currentNormalizedName);
    if (existingError) throw existingError;

    if (!existing || existing.length === 0) {
      await this.ensureCityExists(newName);
      return;
    }

    const { error } = await client
      .from("cities")
      .update({ ...toSnakeCase(buildCityUpdateData({ name: newName })), updated_at: new Date().toISOString() })
      .eq("owner_id", ownerId)
      .eq("normalized_name", currentNormalizedName);
    if (error) throw error;
  },
};

async function getOwnedCity(id: string): Promise<City> {
  const { data, error } = await requireSupabase().from("cities").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("City not found.");
  return toCamelCase<City>(data);
}

function sortCities(cities: City[]) {
  return [...cities].sort((left, right) => left.name.localeCompare(right.name, "de"));
}
