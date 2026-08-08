export const routes = {
  login: "/(auth)/login",
  forgotPassword: "/(auth)/forgot-password",
  cities: "/(tabs)/cities",
  add: "/(tabs)/add",
  map: "/(tabs)/map",
  management: "/(tabs)/management",
  settings: "/(tabs)/settings",
  admin: "/admin",
  adminUsers: "/admin/users",
  adminCreateUser: "/admin/create-user",
} as const;
