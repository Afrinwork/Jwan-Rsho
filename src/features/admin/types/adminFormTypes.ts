export type CreatableUserRole = "admin" | "driver";

export type CreateUserFormValues = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: CreatableUserRole;
};

export type DeleteUserFormValues = {
  email: string;
};
