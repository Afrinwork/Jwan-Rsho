import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

import { buildCityCreateData, buildCityUpdateData, CityWrite } from "@/src/repositories/cityRepositoryData";
import { mapSnapshot, requireCurrentUserId, requireDb } from "@/src/repositories/repositoryContext";
import { City } from "@/src/types/city";

export const cityRepository = {
  async getCities() {
    const ownerId = requireCurrentUserId();
    const cityQuery = query(collection(requireDb(), "cities"), where("ownerId", "==", ownerId));
    return sortCities((await getDocs(cityQuery)).docs.map((value) => mapSnapshot<City>(value)));
  },

  async getCityByNormalizedName(normalizedName: string) {
    const ownerId = requireCurrentUserId();
    const cityQuery = query(
      collection(requireDb(), "cities"),
      where("ownerId", "==", ownerId),
      where("normalizedName", "==", normalizedName),
    );
    const snapshot = await getDocs(cityQuery);
    return snapshot.empty ? null : mapSnapshot<City>(snapshot.docs[0]);
  },

  async updateCity(id: string, input: Partial<CityWrite>) {
    const snapshot = await getOwnedCity(id);
    await updateDoc(snapshot.ref, { ...clean(buildCityUpdateData(input)), updatedAt: new Date().toISOString() });
  },

  async deleteCity(id: string) {
    const snapshot = await getOwnedCity(id);
    await deleteDoc(snapshot.ref);
  },

  // Cities have no manual "add" form — a city entity is created automatically
  // the first time it's used on a customer (see customerRepository), and from
  // then on persists independently, even once no customers reference it.
  async ensureCityExists(name: string) {
    const trimmed = name.trim();

    if (!trimmed) {
      return;
    }

    const ownerId = requireCurrentUserId();
    const normalizedName = trimmed.toLowerCase();
    const cityQuery = query(
      collection(requireDb(), "cities"),
      where("ownerId", "==", ownerId),
      where("normalizedName", "==", normalizedName),
    );
    const existing = await getDocs(cityQuery);

    if (!existing.empty) {
      return;
    }

    const cityRef = doc(collection(requireDb(), "cities"));
    await setDoc(cityRef, withCreateTimestamps(buildCityCreateData({ name: trimmed }, ownerId)));
  },

  // Renames the city entity for the given normalized name — creates one if it
  // doesn't exist yet (e.g. legacy customers from before cities were tracked).
  async renameCityEntity(currentNormalizedName: string, newName: string) {
    const ownerId = requireCurrentUserId();
    const cityQuery = query(
      collection(requireDb(), "cities"),
      where("ownerId", "==", ownerId),
      where("normalizedName", "==", currentNormalizedName),
    );
    const existing = await getDocs(cityQuery);

    if (existing.empty) {
      await this.ensureCityExists(newName);
      return;
    }

    await Promise.all(
      existing.docs.map((value) =>
        updateDoc(value.ref, { ...clean(buildCityUpdateData({ name: newName })), updatedAt: new Date().toISOString() }),
      ),
    );
  },
};

async function getOwnedCity(id: string) {
  const ownerId = requireCurrentUserId();
  const snapshot = await getDoc(doc(requireDb(), "cities", id));

  if (!snapshot.exists() || snapshot.data().ownerId !== ownerId) {
    throw new Error("City not found.");
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

function sortCities(cities: City[]) {
  return [...cities].sort((left, right) => left.name.localeCompare(right.name, "de"));
}
