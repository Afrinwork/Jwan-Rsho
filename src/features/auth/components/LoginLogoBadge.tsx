import { Image, StyleSheet, View } from "react-native";

import { useThemeColors } from "@/src/hooks/useThemeColors";
import { radius } from "@/src/theme/radius";

const logo = require("../../../../assets/icon.png");
const LOGO_SIZE = 88;

export function LoginLogoBadge() {
  const colors = useThemeColors();

  return (
    <View style={[styles.frame, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
      <Image resizeMode="cover" source={logo} style={styles.logo} />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignItems: "center",
    alignSelf: "center",
    borderRadius: radius.card,
    borderWidth: 1,
    height: LOGO_SIZE,
    justifyContent: "center",
    overflow: "hidden",
    width: LOGO_SIZE,
  },
  logo: {
    height: LOGO_SIZE,
    width: LOGO_SIZE,
  },
});
