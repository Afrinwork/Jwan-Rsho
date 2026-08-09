import { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet } from "react-native";

const splashLogo = require("../../../assets/ChatGPT Image 9. Aug. 2026, 08_10_30.png");
const SPLASH_DURATION_MS = 4000;
const FADE_OUT_MS = 450;

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
    backgroundColor: "#0F2747",
  },
  logo: {
    width: 240,
    height: 240,
  },
});
