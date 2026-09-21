import { useEffect, useState } from "react";
import { Image, StyleSheet, View } from "react-native";

import { useThemeColors } from "@/src/hooks/useThemeColors";

const splashLogo = require("../../../assets/splash-logo-transparent.png");
const SPLASH_DURATION_MS = 700;

export function StartupSplash() {
  const colors = useThemeColors();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timeoutId = setTimeout(() => setVisible(false), SPLASH_DURATION_MS);
    return () => clearTimeout(timeoutId);
  }, []);

  if (!visible) return null;

  return (
    <View pointerEvents="none" style={[styles.overlay, { backgroundColor: colors.background }]}>
      <Image resizeMode="contain" source={splashLogo} style={styles.logo} />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    elevation: 20,
    justifyContent: "center",
    zIndex: 999,
  },
  logo: {
    height: 176,
    width: 176,
  },
});
