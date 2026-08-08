import { create } from "zustand";

type AppStore = {
  themeMode: "system" | "light" | "dark";
  setThemeMode: (value: "system" | "light" | "dark") => void;
};

export const useAppStore = create<AppStore>((set) => ({
  themeMode: "system",
  setThemeMode: (value) => set({ themeMode: value }),
}));
