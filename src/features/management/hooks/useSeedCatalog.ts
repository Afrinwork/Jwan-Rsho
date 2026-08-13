import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { useCountries } from "@/src/features/countries/hooks/useCountries";
import { seedCountries, seedProducts } from "@/src/features/management/data/seedCatalog";
import { useProducts } from "@/src/features/products/hooks/useProducts";
import { countryRepository } from "@/src/repositories/countryRepository";
import { productRepository } from "@/src/repositories/productRepository";
import { Country } from "@/src/types/country";
import { Product } from "@/src/types/product";

type NamedEntity = { id: string; name: string; isActive: boolean };

function normalize(value: string) {
  return value.trim().toLowerCase();
}

// Deletes an entry, falling back to deactivating it if it's still referenced
// elsewhere (e.g. by a customer or order) and can't actually be deleted.
async function deleteOrDeactivate<T extends NamedEntity>(
  item: T,
  deleteItem: (item: T) => Promise<void>,
  deactivateItem: (item: T) => Promise<void>,
) {
  try {
    await deleteItem(item);
  } catch {
    if (item.isActive) {
      await deactivateItem(item).catch(() => undefined);
    }
  }
}

// Removes duplicates: (a) stray entries whose name field is actually one of
// the known Arabic nameAr values, left over from an earlier, since-reverted
// Arabic-only seeding attempt, and (b) genuine duplicates sharing the same
// German name, keeping the one that already has the right Arabic name (or
// the first one found) and clearing out the rest.
async function dedupeEntries<T extends NamedEntity>(
  items: T[],
  arabicNames: Set<string>,
  expectedArName: (name: string) => string | undefined,
  getArName: (item: T) => string | undefined,
  deleteItem: (item: T) => Promise<void>,
  deactivateItem: (item: T) => Promise<void>,
) {
  const byName = new Map<string, T[]>();

  for (const item of items) {
    const key = normalize(item.name);

    if (arabicNames.has(key)) {
      await deleteOrDeactivate(item, deleteItem, deactivateItem);
      continue;
    }

    byName.set(key, [...(byName.get(key) ?? []), item]);
  }

  for (const [key, group] of byName) {
    if (group.length < 2) {
      continue;
    }

    const wantedAr = expectedArName(key);
    const keeper = group.find((item) => getArName(item) === wantedAr) ?? group[0];

    for (const item of group) {
      if (item.id !== keeper.id) {
        await deleteOrDeactivate(item, deleteItem, deactivateItem);
      }
    }
  }
}

async function upsertProducts(
  existing: Product[],
  addProduct: (input: { name: string; nameAr: string; defaultUnit: string }) => Promise<void>,
  updateProduct: (id: string, input: { nameAr: string; isActive: true }) => Promise<void>,
) {
  let created = 0;
  let updated = 0;

  for (const seedProduct of seedProducts) {
    const match = existing.find((value) => normalize(value.name) === normalize(seedProduct.name));

    if (!match) {
      await addProduct({ name: seedProduct.name, nameAr: seedProduct.nameAr, defaultUnit: "kg" });
      created += 1;
    } else if (match.nameAr !== seedProduct.nameAr || !match.isActive) {
      await updateProduct(match.id, { nameAr: seedProduct.nameAr, isActive: true });
      updated += 1;
    }
  }

  return { created, updated };
}

async function upsertCountries(
  existing: Country[],
  addCountry: (input: { name: string; nameAr: string; isoCode: string }) => Promise<void>,
  updateCountry: (id: string, input: { nameAr: string; isActive: true }) => Promise<void>,
) {
  let created = 0;
  let updated = 0;

  for (const seedCountry of seedCountries) {
    const match = existing.find((value) => normalize(value.name) === normalize(seedCountry.name));

    if (!match) {
      await addCountry({ name: seedCountry.name, nameAr: seedCountry.nameAr, isoCode: seedCountry.isoCode });
      created += 1;
    } else if (match.nameAr !== seedCountry.nameAr || !match.isActive) {
      await updateCountry(match.id, { nameAr: seedCountry.nameAr, isActive: true });
      updated += 1;
    }
  }

  return { created, updated };
}

export function useSeedCatalog() {
  const { addProduct, updateProduct, deleteProduct, toggleActive: toggleProductActive } = useProducts();
  const { addCountry, updateCountry, deleteCountry, toggleActive: toggleCountryActive } = useCountries();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation("management");

  // Always re-reads current products/countries directly from Firestore rather
  // than trusting the hooks' (potentially stale, closured) state, dedupes,
  // then upserts by German name — safe to run repeatedly.
  const seed = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const productArNames = new Set(seedProducts.map((value) => normalize(value.nameAr)));
      const countryArNames = new Set(seedCountries.map((value) => normalize(value.nameAr)));
      const productArByName = new Map(seedProducts.map((value) => [normalize(value.name), value.nameAr]));
      const countryArByName = new Map(seedCountries.map((value) => [normalize(value.name), value.nameAr]));

      const freshProducts = await productRepository.getProducts();
      await dedupeEntries(
        freshProducts,
        productArNames,
        (name) => productArByName.get(name),
        (item) => item.nameAr,
        deleteProduct,
        toggleProductActive,
      );

      const freshCountries = await countryRepository.getCountries();
      await dedupeEntries(
        freshCountries,
        countryArNames,
        (name) => countryArByName.get(name),
        (item) => item.nameAr,
        deleteCountry,
        toggleCountryActive,
      );

      const productsAfterDedupe = await productRepository.getProducts();
      const countriesAfterDedupe = await countryRepository.getCountries();

      const productResult = await upsertProducts(productsAfterDedupe, addProduct, updateProduct);
      const countryResult = await upsertCountries(countriesAfterDedupe, addCountry, updateCountry);
      const created = productResult.created + countryResult.created;
      const updated = productResult.updated + countryResult.updated;

      setResult(
        created === 0 && updated === 0
          ? t("seed.allPresent")
          : t("seed.summary", { productsCount: created, countriesCount: updated }),
      );
    } catch (seedError) {
      setError(seedError instanceof Error ? seedError.message : t("seed.loadError"));
    } finally {
      setLoading(false);
    }
  }, [
    addCountry,
    addProduct,
    deleteCountry,
    deleteProduct,
    t,
    toggleCountryActive,
    toggleProductActive,
    updateCountry,
    updateProduct,
  ]);

  const reset = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    const failures: string[] = [];

    const freshProducts = await productRepository.getProducts();
    for (const product of freshProducts) {
      try {
        await deleteProduct(product);
      } catch {
        failures.push(product.name);
        if (product.isActive) {
          await toggleProductActive(product).catch(() => undefined);
        }
      }
    }

    const freshCountries = await countryRepository.getCountries();
    for (const country of freshCountries) {
      try {
        await deleteCountry(country);
      } catch {
        failures.push(country.name);
        if (country.isActive) {
          await toggleCountryActive(country).catch(() => undefined);
        }
      }
    }

    await seed();

    if (failures.length > 0) {
      setError(t("seed.resetPartialError", { names: failures.join(", ") }));
    }
  }, [deleteCountry, deleteProduct, seed, t, toggleCountryActive, toggleProductActive]);

  return { seed, reset, loading, result, error };
}
