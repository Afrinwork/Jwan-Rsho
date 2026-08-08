import { useCallback, useEffect, useState } from "react";

import { productRepository } from "@/src/repositories/productRepository";
import { ProductWrite } from "@/src/repositories/productRepositoryData";
import { Product } from "@/src/types/product";
import { formatError } from "@/src/utils/formatError";

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    productRepository
      .getProducts()
      .then((value) => {
        setProducts(value);
        setError(null);
      })
      .catch((value) => setError(formatError(value).message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let active = true;

    productRepository
      .getProducts()
      .then((value) => {
        if (active) {
          setProducts(value);
          setError(null);
        }
      })
      .catch((value) => {
        if (active) {
          setError(formatError(value).message);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const addProduct = useCallback(async (input: ProductWrite) => {
    await productRepository.createProduct(input);
    await load();
  }, [load]);

  const updateProduct = useCallback(async (id: string, input: Partial<ProductWrite>) => {
    await productRepository.updateProduct(id, input);
    await load();
  }, [load]);

  const toggleActive = useCallback(async (product: Product) => {
    await productRepository.updateProduct(product.id, { isActive: !product.isActive });
    await load();
  }, [load]);

  const deleteProduct = useCallback(async (product: Product) => {
    await productRepository.deleteProduct(product.id);
    await load();
  }, [load]);

  const moveProduct = useCallback(async (product: Product, direction: "up" | "down") => {
    const currentIndex = products.findIndex((value) => value.id === product.id);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    const target = products[targetIndex];

    if (currentIndex < 0 || !target) {
      return;
    }

    await productRepository.updateProduct(product.id, { sortOrder: target.sortOrder });
    await productRepository.updateProduct(target.id, { sortOrder: product.sortOrder });
    await load();
  }, [load, products]);

  return {
    products,
    loading,
    error,
    addProduct,
    updateProduct,
    toggleActive,
    deleteProduct,
    moveProduct,
    reload: load,
  };
}
