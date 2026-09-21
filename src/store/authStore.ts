import { create } from "zustand";

import { CurrentUser } from "@/src/types/user";

type AuthStore = {
  currentUser: CurrentUser | null;
  authLoading: boolean;
  authError: string | null;
  setUser: (user: CurrentUser) => void;
  clearUser: () => void;
  setAuthLoading: (value: boolean) => void;
  setAuthError: (value: string | null) => void;
  updateDisplayName: (value: string) => void;
  updateEmail: (value: string) => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
  currentUser: null,
  authLoading: true,
  authError: null,
  setUser: (user) => set({ currentUser: user }),
  clearUser: () => set({ currentUser: null }),
  setAuthLoading: (value) => set({ authLoading: value }),
  setAuthError: (value) => set({ authError: value }),
  updateDisplayName: (value) =>
    set((state) => ({
      currentUser: state.currentUser
        ? { ...state.currentUser, displayName: value }
        : null,
    })),
  updateEmail: (value) =>
    set((state) => ({
      currentUser: state.currentUser
        ? { ...state.currentUser, email: value }
        : null,
    })),
}));
