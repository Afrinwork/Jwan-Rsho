import { create } from "zustand";

import { CurrentUser } from "@/src/types/user";

type AuthStore = {
  currentUser: CurrentUser | null;
  authLoading: boolean;
  authError: string | null;
  isAdmin: boolean;
  setUser: (user: CurrentUser) => void;
  clearUser: () => void;
  setAuthLoading: (value: boolean) => void;
  setAuthError: (value: string | null) => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
  currentUser: null,
  authLoading: true,
  authError: null,
  isAdmin: false,
  setUser: (user) => set({ currentUser: user, isAdmin: user.role === "admin" }),
  clearUser: () => set({ currentUser: null, isAdmin: false }),
  setAuthLoading: (value) => set({ authLoading: value }),
  setAuthError: (value) => set({ authError: value }),
}));
