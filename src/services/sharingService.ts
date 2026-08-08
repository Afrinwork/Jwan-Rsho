import { Share } from "react-native";
import { buildCustomerLocationMessage } from "@/src/services/sharingService.shared";

export const sharingService = {
  async shareText(message: string) {
    return Share.share({ message });
  },
  buildCustomerLocationMessage,
};
