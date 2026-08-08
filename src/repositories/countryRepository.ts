import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

import { AppError } from "@/src/errors/AppError";
import { errorMessages } from "@/src/errors/errorMessages";
import { buildCountryCreateData, buildCountryUpdateData, CountryWrite } from "@/src/repositories/countryRepositoryData";
import { mapSnapshot, requireCurrentUserId, requireDb } from "@/src/repositories/repositoryContext";
import { Country } from "@/src/types/country";

export const countryRepository = {
  async createCountry(input: CountryWrite) {
    const ownerId = requireCurrentUserId();
    await ensureUniqueCountryName(input.name, ownerId);
    const countryRef = doc(collection(requireDb(), "countries"));
    await setDoc(countryRef, withCreateTimestamps(buildCountryCreateData(input, ownerId)));
    return countryRef.id;
  },

  async updateCountry(id: string, input: Partial<CountryWrite>) {
    const snapshot = await getOwnedCountry(id);
    if (input.name) {
      await ensureUniqueCountryName(input.name, snapshot.data().ownerId, id);
    }
    await updateDoc(snapshot.ref, { ...clean(buildCountryUpdateData(input)), updatedAt: new Date().toISOString() });
  },

  async getCountries() {
    const ownerId = requireCurrentUserId();
    const countryQuery = query(collection(requireDb(), "countries"), where("ownerId", "==", ownerId), orderBy("sortOrder"), orderBy("name"));
    return (await getDocs(countryQuery)).docs.map((value) => mapSnapshot<Country>(value));
  },
};

async function ensureUniqueCountryName(name: string, ownerId: string, excludeId?: string) {
  const normalizedName = name.trim().toLowerCase();
  const countryQuery = query(
    collection(requireDb(), "countries"),
    where("ownerId", "==", ownerId),
    where("normalizedName", "==", normalizedName),
  );
  const existing = await getDocs(countryQuery);
  const hasDuplicate = existing.docs.some((value) => value.id !== excludeId);

  if (hasDuplicate) {
    throw new AppError(errorMessages.duplicateCountry);
  }
}

async function getOwnedCountry(id: string) {
  const ownerId = requireCurrentUserId();
  const snapshot = await getDoc(doc(requireDb(), "countries", id));

  if (!snapshot.exists() || snapshot.data().ownerId !== ownerId) {
    throw new Error("Country not found.");
  }

  return snapshot;
}

function withCreateTimestamps<T extends object>(value: T) {
  const timestamp = new Date().toISOString();
  return { ...value, createdAt: timestamp, updatedAt: timestamp };
}

function clean<T extends object>(value: T) {
  return Object.fromEntries(Object.entries(value).filter(([, current]) => current !== undefined)) as T;
}
