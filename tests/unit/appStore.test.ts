import test from "node:test";
import assert from "node:assert/strict";

import { defaultAppPreferences, useAppStore } from "@/src/store/appStore";

test("app preferences reset to defaults after custom values", () => {
  useAppStore.setState({
    ...defaultAppPreferences,
    themeMode: "dark",
    language: "ar",
    preferredNavigationApp: "waze",
    shopName: "🧀 Rsho Kaeserei",
    shareIncludeAddress: false,
    shareIncludePhone: true,
    shareIncludeTotals: false,
  });

  useAppStore.getState().resetPreferences();

  assert.deepEqual(
    {
      themeMode: useAppStore.getState().themeMode,
      language: useAppStore.getState().language,
      preferredNavigationApp: useAppStore.getState().preferredNavigationApp,
      shopName: useAppStore.getState().shopName,
      shareIncludeAddress: useAppStore.getState().shareIncludeAddress,
      shareIncludePhone: useAppStore.getState().shareIncludePhone,
      shareIncludeTotals: useAppStore.getState().shareIncludeTotals,
    },
    defaultAppPreferences,
  );
});
