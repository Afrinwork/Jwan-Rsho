import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

import { MAP_STYLE_KINDS, MapStyleKind } from "@/src/features/map/types/mapViewTypes";

const STORAGE_KEY = "rsho.mapStyleKind";

type MapStyleStore = {
  kind: MapStyleKind;
  setKind: (kind: MapStyleKind) => void;
};

// A per-device choice (like a phone's own map app), so it lives in
// AsyncStorage rather than in the synced user preferences. Storage failures
// are swallowed: the map just opens with the default look.
export const useMapStyleKind = create<MapStyleStore>((set) => ({
  kind: "light",
  setKind: (kind) => {
    set({ kind });
    void AsyncStorage.setItem(STORAGE_KEY, kind).catch(() => undefined);
  },
}));

void AsyncStorage.getItem(STORAGE_KEY)
  .then((stored) => {
    if (stored && MAP_STYLE_KINDS.includes(stored as MapStyleKind)) useMapStyleKind.setState({ kind: stored as MapStyleKind });
  })
  .catch(() => undefined);
