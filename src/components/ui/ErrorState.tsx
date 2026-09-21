import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/src/components/ui/AppText";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { radius } from "@/src/theme/radius";
import { spacing } from "@/src/theme/spacing";

type ErrorStateProps = {
  message: string;
  durationMs?: number;
};

const DEFAULT_DURATION_MS = 3600;

export function ErrorState({ message, durationMs = DEFAULT_DURATION_MS }: ErrorStateProps) {
  const colors = useThemeColors();
  const [shownMessage, setShownMessage] = useState(message);
  const [visible, setVisible] = useState(true);

  // A new message re-triggers the visible-for-duration cycle even though
  // this component instance doesn't remount. Adjusting state directly
  // during render (React's documented pattern for "reset state when a prop
  // changes") instead of in the effect below, which now only owns the
  // auto-hide timer.
  if (message !== shownMessage) {
    setShownMessage(message);
    setVisible(true);
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => setVisible(false), durationMs);
    return () => clearTimeout(timeoutId);
  }, [durationMs, message]);

  if (!visible) {
    return null;
  }

  return (
    <View
      style={[styles.container, { backgroundColor: colors.dangerBackground, borderColor: colors.dangerBorder }]}
    >
      <AppText color="danger" variant="bodyMedium">
        {message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
});
