import { Share } from "react-native";

export const sharingService = {
  async shareText(message: string) {
    return Share.share({ message });
  },
};
