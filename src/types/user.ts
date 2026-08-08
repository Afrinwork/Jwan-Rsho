export type UserRole = "admin" | "user";

export type UserProfile = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  ownerId?: string;
};

export type CurrentUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
};
