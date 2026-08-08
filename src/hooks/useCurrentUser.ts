import { useAuthStore } from "@/src/store/authStore";

export function useCurrentUser() {
  return useAuthStore((state) => state.currentUser);
}
