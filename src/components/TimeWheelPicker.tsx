import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, PanResponder, Animated } from 'react-native';
import { Colors, FontSize, Radius, Spacing, Weight, } from '../constants/theme';

const ITEM_HEIGHT = 44;
const VISIBLE_COUNT = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_COUNT;
const HALF = Math.floor(VISIBLE_COUNT / 2);
const HALF_PADDING = ITEM_HEIGHT * HALF;

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

// Helper: read current Animated.Value
const val = (av: Animated.Value): number =>
  (av as any)._value as number;

interface WheelColumnProps {
  data: number[];
  selected: number;
  onSelect: (v: number) => void;
  label: string;
}

function WheelColumn({ data, selected, onSelect, label }: WheelColumnProps) {
  const offset = useRef(new Animated.Value(0)).current;
  const startOffset = useRef(0);
  const maxOffset = (data.length - 1) * ITEM_HEIGHT;

  // Init offset to match selected
  useEffect(() => {
    const target = data.indexOf(selected) * ITEM_HEIGHT;
    offset.setValue(target);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const snapOffset = useCallback(
    (raw: number) => {
      const clamped = Math.max(0, Math.min(maxOffset, raw));
      const index = Math.round(clamped / ITEM_HEIGHT);
      return { offset: index * ITEM_HEIGHT, index };
    },
    [maxOffset],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 4,
        onPanResponderGrant: () => {
          startOffset.current = val(offset);
        },
        onPanResponderMove: (_, gs) => {
          // Drag down (positive dy) → scroll toward earlier items → decrease offset
          const raw = startOffset.current - gs.dy;
          // Allow some rubber band
          const clamped = Math.max(-HALF_PADDING, Math.min(maxOffset + HALF_PADDING, raw));
          offset.setValue(clamped);
        },
        onPanResponderRelease: () => {
          const { offset: snapped, index } = snapOffset(val(offset));
          Animated.spring(offset, {
            toValue: snapped,
            useNativeDriver: true,
            speed: 40,
            bounciness: 0,
          }).start();
          if (data[index] !== undefined && data[index] !== selected) {
            onSelect(data[index]);
          }
        },
        onPanResponderTerminate: () => {
          const { offset: snapped } = snapOffset(val(offset));
          offset.setValue(snapped);
        },
      }),
    [offset, maxOffset, snapOffset, data, selected, onSelect],
  );

  const translateY = Animated.multiply(offset, -1);

  const items = data.map((item) => (
    <View key={item} style={styles.item}>
      <Text style={styles.itemText}>
        {String(item).padStart(2, '0')}
      </Text>
    </View>
  ));

  return (
    <View style={styles.column}>
      <Text style={styles.columnLabel}>{label}</Text>
      <View style={styles.pickerWrapper} {...panResponder.panHandlers}>
        {/* fixed highlight bar */}
        <View style={styles.highlight} pointerEvents="none" />
        {/* animated content */}
        <Animated.View
          style={[
            styles.itemsContainer,
            { paddingVertical: HALF_PADDING, transform: [{ translateY }] },
          ]}
        >
          {items}
        </Animated.View>
        {/* fades overlay */}
        <View style={styles.fadeTop} pointerEvents="none" />
        <View style={styles.fadeBottom} pointerEvents="none" />
      </View>
    </View>
  );
}

interface Props {
  hour: number;
  minute: number;
  onHourChange: (h: number) => void;
  onMinuteChange: (m: number) => void;
}

export default function TimeWheelPicker({ hour, minute, onHourChange, onMinuteChange }: Props) {
  return (
    <View style={styles.container}>
      <WheelColumn data={HOURS} selected={hour} onSelect={onHourChange} label="时" />
      <Text style={styles.colon}>:</Text>
      <WheelColumn data={MINUTES} selected={minute} onSelect={onMinuteChange} label="分" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  column: { alignItems: 'center' },
  columnLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
    fontWeight: Weight.semibold,
  },
  pickerWrapper: {
    height: PICKER_HEIGHT,
    width: 72,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: Radius.md,
  },
  highlight: {
    position: 'absolute',
    top: ITEM_HEIGHT * HALF,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    backgroundColor: Colors.primaryBg,
    borderRadius: Radius.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.primaryLight,
    zIndex: 1,
  },
  fadeTop: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: ITEM_HEIGHT * HALF,
    backgroundColor: Colors.cardBg,
    opacity: 0.55,
    zIndex: 1,
  },
  fadeBottom: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: ITEM_HEIGHT * HALF,
    backgroundColor: Colors.cardBg,
    opacity: 0.55,
    zIndex: 1,
  },
  itemsContainer: {
    zIndex: 2,
  },
  item: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    fontSize: FontSize.xxl,
    color: Colors.textHint,
    fontWeight: Weight.medium,
    fontVariant: ['tabular-nums'],
  },
  colon: {
    fontSize: FontSize.display,
    fontWeight: Weight.bold,
    color: Colors.primary,
    marginHorizontal: Spacing.md,
    marginTop: 20,
  },
});
