import React, { useRef, useState } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { Colors, Radius, Shadow } from '../constants/theme';

/** 全局轻提示：显示 6 秒 + 800ms 淡出（原生 Toast 时长固定且无动画，看不清错误信息） */

let showFn: ((message: string) => void) | null = null;

/** 命令式调用：任意位置 showToast('...') */
export function showToast(message: string) {
  showFn?.(message);
}

const DISPLAY_MS = 6000;
const FADE_OUT_MS = 800;

export default function ToastHost() {
  const opacity = useRef(new Animated.Value(0)).current;
  const [message, setMessage] = useState('');
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seqRef = useRef(0);

  showFn = (msg: string) => {
    const seq = ++seqRef.current;
    setMessage(msg);
    setVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    hideTimer.current = setTimeout(() => {
      if (seq !== seqRef.current) return;
      Animated.timing(opacity, { toValue: 0, duration: FADE_OUT_MS, useNativeDriver: true })
        .start(({ finished }) => {
          if (finished && seq === seqRef.current) setVisible(false);
        });
    }, DISPLAY_MS);
  };

  if (!visible) return null;

  return (
    <Animated.View pointerEvents="none" style={[styles.toast, { opacity }]}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 120,
    alignSelf: 'center',
    maxWidth: '85%',
    backgroundColor: Colors.ink,
    borderRadius: Radius.md,
    paddingHorizontal: 18,
    paddingVertical: 12,
    ...Shadow.raised,
    zIndex: 9999,
    elevation: 20,
  },
  text: {
    color: Colors.white,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
