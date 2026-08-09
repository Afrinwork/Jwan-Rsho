import { useCallback, useState } from "react";

import { useCountries } from "@/src/features/countries/hooks/useCountries";
import { seedCountries, seedProducts } from "@/src/features/management/data/seedCatalog";
import { findMissingByName } from "@/src/features/management/services/seedCatalogService";
import { useProducts } from "@/src/features/products/hooks/useProducts";

export function useSeedCatalog() {
  const { products, addProduct } = useProducts();
  const { countries, addCountry } = useCountries();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const seed = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const missingProducts = findMissingByName(
        seedProducts.map((name) => ({ name })),
        products.map((value) => value.name),
      );
      const missingCountries = findMissingByName(seedCountries, countries.map((value) => value.name));

      for (const product of missingProducts) {
        await addProduct({ name: product.name, defaultUnit: "kg" });
      }

      for (const country of missingCountries) {
        await addCountry({ name: country.name, isoCode: country.isoCode });
      }

      setResult(
        missingProducts.length === 0 && missingCountries.length === 0
          ? "Alle Beispieldaten sind bereits vorhanden."
          : `${missingProducts.length} Produkt(e) und ${missingCountries.length} Land/Laender hinzugefuegt.`,
      );
    } catch (seedError) {
      setError(seedError instanceof Error ? seedError.message : "Beispieldaten konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }, [addCountry, addProduct, countries, products]);

  return { seed, loading, result, error };
}
