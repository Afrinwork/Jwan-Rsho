import { authRepository } from "@/src/repositories/authRepository";

export const authService = {
  login: authRepository.login,
  logout: authRepository.logout,
  resetPassword: authRepository.resetPassword,
  updateEmail: authRepository.updateEmail,
  changePassword: authRepository.changePassword,
};
