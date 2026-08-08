import * as SecureStore from "expo-secure-store";

export const secureStorageService = {
  getItem: SecureStore.getItemAsync,
  setItem: SecureStore.setItemAsync,
  deleteItem: SecureStore.deleteItemAsync,
};
