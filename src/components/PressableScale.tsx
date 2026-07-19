import React, { useCallback, useRef, type ReactNode } from 'react';
import { Pressable, Animated, ViewStyle, StyleProp } from 'react-native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props {
  onPress?: () => void;
  onLongPress?: () => void;
  children: ReactNode;
  /** Layout + visual styles — applied directly to Pressable, no wrapper interference */
  style?: StyleProp<ViewStyle>;
  /** Scale target on press-in. Default 0.97. */
  scaleTo?: number;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'header' | 'link' | 'none' | 'tab';
}

/**
 * Pressable wrapper with spring scale + opacity fade on press.
 * Uses Animated.createAnimatedComponent(Pressable) so transform
 * lives on the Pressable itself — no wrapper View to break flex layouts.
 * Also suppresses Android ripple via android_ripple={null}.
 */
export default function PressableScale({
  onPress,
  onLongPress,
  children,
  style,
  scaleTo = 0.97,
  disabled = false,
  accessibilityLabel,
  accessibilityRole,
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: scaleTo, speed: 80, bounciness: 0, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0.7, duration: 80, useNativeDriver: true }),
    ]).start();
  }, [scale, opacity, scaleTo]);

  const handlePressOut = useCallback(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, speed: 60, bounciness: 4, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
  }, [scale, opacity]);

  return (
    <AnimatedPressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      android_ripple={null}
      style={[style, { transform: [{ scale }], opacity }]}
    >
      {children}
    </AnimatedPressable>
  );
}
