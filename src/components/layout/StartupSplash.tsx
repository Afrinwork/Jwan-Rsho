import { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

const splashLogo = require("../../../assets/ChatGPT Image 9. Aug. 2026, 07_10_04.png");
const SPLASH_DURATION_MS = 4000;
const FADE_OUT_MS = 550;

export function StartupSplash() {
  const [visible, setVisible] = useState(true);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;
  const scale = useRef(new Animated.Value(0.94)).current;

  useEffect(() => {
    const entranceAnimation = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    const floatAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: -8,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 6,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    entranceAnimation.start(({ finished }) => {
      if (finished) {
        floatAnimation.start();
      }
    });

    const timeoutId = setTimeout(() => {
      floatAnimation.stop();
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: FADE_OUT_MS,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1.04,
          duration: FADE_OUT_MS,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => setVisible(false));
    }, SPLASH_DURATION_MS - FADE_OUT_MS);

    return () => {
      clearTimeout(timeoutId);
      entranceAnimation.stop();
      floatAnimation.stop();
    };
  }, [opacity, scale, translateY]);

  if (!visible) {
    return null;
  }

  return (
    <View pointerEvents="none" style={styles.overlay}>
      <Animated.Image
        resizeMode="contain"
        source={splashLogo}
        style={[
          styles.logo,
          {
            opacity,
            transform: [{ translateY }, { scale }],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
    elevation: 20,
    padding: 24,
    backgroundColor: "transparent",
  },
  logo: {
    width: "76%",
    maxWidth: 280,
    height: 280,
  },
});
