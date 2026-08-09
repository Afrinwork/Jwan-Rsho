import { useCallback, useEffect, useState } from "react";

import { regionRepository } from "@/src/repositories/regionRepository";
import { RegionWrite } from "@/src/repositories/regionRepositoryData";
import { Region } from "@/src/types/region";
import { formatError } from "@/src/utils/formatError";

export function useRegions() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      setRegions(await regionRepository.getRegions());
      setError(null);
    } catch (value) {
      setError(formatError(value).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void load();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [load]);

  const addRegion = useCallback(async (input: RegionWrite) => {
    await regionRepository.createRegion(input);
    await load();
  }, [load]);

  const updateRegion = useCallback(async (id: string, input: Partial<RegionWrite>) => {
    await regionRepository.updateRegion(id, input);
    await load();
  }, [load]);

  const toggleActive = useCallback(async (region: Region) => {
    await regionRepository.updateRegion(region.id, { isActive: !region.isActive });
    await load();
  }, [load]);

  const deleteRegion = useCallback(async (region: Region) => {
    await regionRepository.deleteRegion(region.id);
    await load();
  }, [load]);

  return { regions, loading, error, addRegion, updateRegion, toggleActive, deleteRegion };
}
