import {
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

import { AppError } from "@/src/errors/AppError";
import { errorMessages } from "@/src/errors/errorMessages";
import { buildRegionCreateData, buildRegionUpdateData, RegionWrite } from "@/src/repositories/regionRepositoryData";
import { mapSnapshot, requireCurrentUserId, requireDb } from "@/src/repositories/repositoryContext";
import { Region } from "@/src/types/region";

export const regionRepository = {
  async createRegion(input: RegionWrite) {
    const ownerId = requireCurrentUserId();
    await ensureUniqueRegion(input, ownerId);
    const regionRef = doc(collection(requireDb(), "regions"));
    await setDoc(regionRef, withCreateTimestamps(buildRegionCreateData(input, ownerId)));
    return regionRef.id;
  },

  async updateRegion(id: string, input: Partial<RegionWrite>) {
    const snapshot = await getOwnedRegion(id);
    await ensureUniqueRegion(
      {
        name: input.name ?? snapshot.data().name,
        country: input.country ?? snapshot.data().country,
        city: input.city ?? snapshot.data().city,
      },
      snapshot.data().ownerId,
      id,
    );
    await updateDoc(snapshot.ref, {
      ...clean(buildRegionUpdateData(input)),
      updatedAt: new Date().toISOString(),
    });
  },

  async getRegions() {
    const ownerId = requireCurrentUserId();
    const regionQuery = query(
      collection(requireDb(), "regions"),
      where("ownerId", "==", ownerId),
    );
    return sortRegions((await getDocs(regionQuery)).docs.map((value) => mapSnapshot<Region>(value)));
  },

  async deleteRegion(id: string) {
    const snapshot = await getOwnedRegion(id);
    const customerQuery = query(
      collection(requireDb(), "customers"),
      where("ownerId", "==", snapshot.data().ownerId),
      where("country", "==", snapshot.data().country),
      where("region", "==", snapshot.data().name),
    );
    const usageCount = (await getCountFromServer(customerQuery)).data().count;

    if (usageCount > 0) {
      throw new AppError(errorMessages.regionInUse);
    }

    await deleteDoc(snapshot.ref);
  },
};

async function ensureUniqueRegion(input: Pick<RegionWrite, "name" | "country" | "city">, ownerId: string, excludeId?: string) {
  const regionQuery = query(
    collection(requireDb(), "regions"),
    where("ownerId", "==", ownerId),
    where("normalizedName", "==", input.name.trim().toLowerCase()),
    where("normalizedCountry", "==", input.country.trim().toLowerCase()),
  );
  const existing = await getDocs(regionQuery);
  const normalizedCity = input.city?.trim().toLowerCase() ?? "";
  const hasDuplicate = existing.docs.some((value) => {
    if (value.id === excludeId) {
      return false;
    }
    return (value.data().normalizedCity ?? "") === normalizedCity;
  });

  if (hasDuplicate) {
    throw new AppError(errorMessages.duplicateRegion);
  }
}

async function getOwnedRegion(id: string) {
  const ownerId = requireCurrentUserId();
  const snapshot = await getDoc(doc(requireDb(), "regions", id));

  if (!snapshot.exists() || snapshot.data().ownerId !== ownerId) {
    throw new Error("Region not found.");
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

function sortRegions(regions: Region[]) {
  return [...regions].sort((left, right) => {
    const countryCompare = left.country.localeCompare(right.country, "de");
    if (countryCompare !== 0) {
      return countryCompare;
    }
    return left.name.localeCompare(right.name, "de");
  });
}
