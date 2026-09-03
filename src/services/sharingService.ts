import { Share } from "react-native";

import { buildCustomerLocationMessage } from "@/src/services/sharingService.shared";

export const sharingService = {
  // For sending several customers' messages one at a time, call this once
  // per message from an explicit user tap (see useRouteSelectionActions) —
  // react-native's Share.share() does not reliably wait for the user to
  // finish on Android, so firing it in an unattended loop races ahead and
  // only the last share sheet ever really lands.
  async shareText(message: string) {
    return Share.share({ message });
  },
  buildCustomerLocationMessage,
};
