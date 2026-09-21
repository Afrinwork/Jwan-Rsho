export type UserRole = "super_admin" | "admin" | "driver";

export type UserProfile = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive?: boolean;
  managerId?: string;
};

export type CurrentUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  managerId?: string;
};
