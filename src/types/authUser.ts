// Backend-agnostic shape both authRepository implementations
// (Firebase and Supabase) normalize their auth-state-change callback to,
// so useAuthSession.ts never needs to know which backend is active.
export type AuthUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
};
