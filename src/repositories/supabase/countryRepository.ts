import { AppError } from "@/src/errors/AppError";
import { errorMessages } from "@/src/errors/errorMessages";
import { buildCountryCreateData, buildCountryUpdateData, CountryWrite } from "@/src/repositories/countryRepositoryData";
import { toCamelCase, toSnakeCase } from "@/src/repositories/supabase/caseMapping";
import { requireCurrentUserId, requireSupabase } from "@/src/repositories/supabase/repositoryContext";
import { Country } from "@/src/types/country";
import type { Database } from "@/src/types/supabase";
import { generateUuid } from "@/src/utils/uuid";

type CountryInsert = Database["public"]["Tables"]["countries"]["Insert"];

export const countryRepository = {
  async createCountry(input: CountryWrite) {
    const ownerId = requireCurrentUserId();
    await ensureUniqueCountryName(input.name, ownerId);
    const id = generateUuid();
    const timestamp = new Date().toISOString();
    const { error } = await requireSupabase()
      .from("countries")
      .insert({
        ...toSnakeCase(buildCountryCreateData(input, ownerId)),
        id,
        created_at: timestamp,
        updated_at: timestamp,
      } as CountryInsert);
    if (error) throw error;
    return id;
  },

  async updateCountry(id: string, input: Partial<CountryWrite>) {
    const country = await getOwnedCountry(id);
    if (input.name) {
      await ensureUniqueCountryName(input.name, country.ownerId, id);
    }
    const { error } = await requireSupabase()
      .from("countries")
      .update({ ...toSnakeCase(buildCountryUpdateData(input)), updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  },

  async getCountries() {
    const ownerId = requireCurrentUserId();
    const { data, error } = await requireSupabase().from("countries").select("*").eq("owner_id", ownerId);
    if (error) throw error;
    return sortCountries((data ?? []).map((row) => toCamelCase<Country>(row)));
  },

  async deleteCountry(id: string) {
    const country = await getOwnedCountry(id);
    const { count, error: countError } = await requireSupabase()
      .from("customers")
      .select("*", { count: "exact", head: true })
      .eq("owner_id", country.ownerId)
      .eq("country", country.name);
    if (countError) throw countError;

    if ((count ?? 0) > 0) {
      throw new AppError(errorMessages.countryInUse);
    }

    const { error } = await requireSupabase().from("countries").delete().eq("id", id);
    if (error) throw error;
  },
};

async function ensureUniqueCountryName(name: string, ownerId: string, excludeId?: string) {
  const normalizedName = name.trim().toLowerCase();
  const { data, error } = await requireSupabase()
    .from("countries")
    .select("id")
    .eq("owner_id", ownerId)
    .eq("normalized_name", normalizedName);
  if (error) throw error;

  const hasDuplicate = (data ?? []).some((value) => value.id !== excludeId);
  if (hasDuplicate) {
    throw new AppError(errorMessages.duplicateCountry);
  }
}

async function getOwnedCountry(id: string): Promise<Country> {
  const { data, error } = await requireSupabase().from("countries").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Country not found.");
  return toCamelCase<Country>(data);
}

function sortCountries(countries: Country[]) {
  return [...countries].sort((left, right) => {
    if (left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder;
    }
    return left.name.localeCompare(right.name, "de");
  });
}
