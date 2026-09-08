import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing } from "react-native";
import { motion } from "@/theme";

/**
 * True when the person has asked their device to reduce motion.
 * Every animation in the app must check this and fall back to no movement.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled?.().then((value) => {
      if (alive) setReduced(!!value);
    });
    const sub = AccessibilityInfo.addEventListener?.("reduceMotionChanged", (value) =>
      setReduced(!!value)
    );
    return () => {
      alive = false;
      sub?.remove?.();
    };
  }, []);

  return reduced;
}

/** Gentle fade + lift used when a screen or card first appears. */
export function useEntrance(delay = 0) {
  const reduced = useReducedMotion();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduced) {
      progress.setValue(1);
      return;
    }
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: motion.slow,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [reduced, delay, progress]);

  return {
    opacity: progress,
    transform: [
      {
        translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [reduced ? 0 : 10, 0] }),
      },
    ],
  };
}

/** A soft "settle" on press, so a tap always feels acknowledged. */
export function usePressScale() {
  const reduced = useReducedMotion();
  const scale = useRef(new Animated.Value(1)).current;

  const to = (value: number) => {
    if (reduced) return;
    Animated.timing(scale, {
      toValue: value,
      duration: motion.fast,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  return {
    scale,
    onPressIn: () => to(motion.pressScale),
    onPressOut: () => to(1),
  };
}
