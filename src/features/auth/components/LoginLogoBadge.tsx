import { useEffect, useRef } from "react";
import { Animated, Easing, Image, StyleSheet } from "react-native";

import { useThemeColors } from "@/src/hooks/useThemeColors";
import { radius } from "@/src/theme/radius";
import { shadows } from "@/src/theme/shadows";

const logo = require("../../../../assets/icon.png");

export function LoginLogoBadge() {
  const colors = useThemeColors();
  const pulse = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    const spinLoop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 12000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    pulseLoop.start();
    spinLoop.start();

    return () => {
      pulseLoop.stop();
      spinLoop.stop();
    };
  }, [pulse, spin]);

  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] });
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  return (
    <Animated.View style={styles.wrapper}>
      <Animated.View
        style={[
          styles.dashedRing,
          { borderColor: colors.primary, transform: [{ rotate }] },
        ]}
      />
      <Animated.View
        style={[
          styles.glowRing,
          { backgroundColor: colors.primaryMuted, opacity: ringOpacity, transform: [{ scale: ringScale }] },
        ]}
      />
      <Animated.View style={[styles.badge, { shadowColor: colors.primary }]}>
        <Image resizeMode="cover" source={logo} style={styles.logo} />
      </Animated.View>
    </Animated.View>
  );
}

const BADGE_SIZE = 96;

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    width: BADGE_SIZE + 40,
    height: BADGE_SIZE + 40,
  },
  dashedRing: {
    position: "absolute",
    width: BADGE_SIZE + 34,
    height: BADGE_SIZE + 34,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderStyle: "dashed",
    opacity: 0.5,
  },
  glowRing: {
    position: "absolute",
    width: BADGE_SIZE + 18,
    height: BADGE_SIZE + 18,
    borderRadius: radius.pill,
  },
  badge: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: radius.pill,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    ...shadows.md,
    shadowOpacity: 0.22,
  },
  logo: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
  },
});
