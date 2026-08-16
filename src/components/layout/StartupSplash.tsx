import { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { radius } from "@/src/theme/radius";

const splashLogo = require("../../../assets/splash-logo-transparent.png");
const SPLASH_DURATION_MS = 4000;
const FADE_OUT_MS = 450;
const SPLASH_GRADIENT = ["#FFFFFF", "#FFFDF8", "#FBF6EC"] as const;
const SPLASH_GLOW_COLOR = "rgba(203, 168, 90, 0.16)";

export function StartupSplash() {
  const [visible, setVisible] = useState(true);
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(0.82)).current;

  useEffect(() => {
    const zoomIn = Animated.timing(scale, {
      toValue: 1,
      duration: SPLASH_DURATION_MS - FADE_OUT_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });

    zoomIn.start();

    const timeoutId = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: FADE_OUT_MS,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }).start(() => setVisible(false));
    }, SPLASH_DURATION_MS - FADE_OUT_MS);

    return () => {
      clearTimeout(timeoutId);
      zoomIn.stop();
    };
  }, [opacity, scale]);

  if (!visible) {
    return null;
  }

  return (
    <Animated.View pointerEvents="none" style={[styles.overlay, { opacity }]}>
      <LinearGradient
        colors={SPLASH_GRADIENT}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={StyleSheet.absoluteFillObject}
      />
      <Animated.View style={[styles.glow, { backgroundColor: SPLASH_GLOW_COLOR, transform: [{ scale }] }]} />
      <Animated.Image
        resizeMode="contain"
        source={splashLogo}
        style={[styles.logo, { transform: [{ scale }] }]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
    elevation: 20,
  },
  glow: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: radius.pill,
    opacity: 0.24,
  },
  logo: {
    width: 240,
    height: 240,
  },
});
