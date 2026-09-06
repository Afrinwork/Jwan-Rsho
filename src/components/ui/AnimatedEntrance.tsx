import { PropsWithChildren, useEffect, useState } from "react";
import { Animated, Easing, ViewStyle } from "react-native";

type AnimatedEntranceProps = PropsWithChildren<{
  delay?: number;
  distance?: number;
  style?: ViewStyle | ViewStyle[];
}>;

export function AnimatedEntrance({
  children,
  delay = 0,
  distance = 16,
  style,
}: AnimatedEntranceProps) {
  // Lazy useState (not useRef) so the imperative Animated.Value can be read
  // during render without tripping the "no ref reads during render" rule —
  // the initializer still runs once, keeping the same stable instance.
  const [opacity] = useState(() => new Animated.Value(0));
  const [translateY] = useState(() => new Animated.Value(distance));
  const [scale] = useState(() => new Animated.Value(0.985));

  useEffect(() => {
    opacity.setValue(0);
    translateY.setValue(distance);
    scale.setValue(0.985);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 360,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 420,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 440,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    return () => {
      opacity.stopAnimation();
      translateY.stopAnimation();
      scale.stopAnimation();
    };
  }, [delay, distance, opacity, scale, translateY]);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }, { scale }] }]}>
      {children}
    </Animated.View>
  );
}
