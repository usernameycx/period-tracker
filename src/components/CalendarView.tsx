import React, { useMemo, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, PanResponder, Animated } from 'react-native';
import { usePeriod } from '../context/PeriodContext';
import { getPhaseForCalendarDay, CalendarPhaseInfo } from '../services/prediction';
import { parseDate, formatDate, isSameDay } from '../utils/date';
import { Phase, PHASE_LABELS, PHASE_COLORS, FERTILITY_COLOR } from '../constants/phases';
import { Colors, Spacing, FontSize, Radius, Shadow, Weight } from '../constants/theme';
import PressableScale from './PressableScale';
import Icon from './Icon';

interface Props {
  onDayPress: (date: Date) => void;
  selectedDate: Date;
  currentMonth: Date;
  onMonthChange: (d: Date) => void;
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];
const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export default function CalendarView({ onDayPress, selectedDate, currentMonth, onMonthChange }: Props) {
  const { records } = usePeriod();

  const phaseMap = useMemo(() => {
    const map = new Map<string, CalendarPhaseInfo>();
    if (records.length === 0) return map;
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const start = new Date(year, month - 1, 20);
    const end = new Date(year, month + 1, 10);
    const d = new Date(start);
    while (d <= end) {
      const info = getPhaseForCalendarDay(d, records);
      if (info) map.set(formatDate(new Date(d)), info);
      d.setDate(d.getDate() + 1);
    }
    return map;
  }, [records, currentMonth]);

  const recordDateSet = useMemo(() => new Set(records.map(r => r.start_date)), [records]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const { days, rows } = useMemo(() => {
    const d: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) d.push(null);
    for (let i = 1; i <= daysInMonth; i++) d.push(i);
    while (d.length % 7 !== 0) d.push(null);
    return { days: d, rows: chunk(d, 7) };
  }, [firstDay, daysInMonth]);

  // ── Swipe gesture ──
  const panX = useRef(new Animated.Value(0)).current;
  const goPrevRef = useRef(() => onMonthChange(new Date(year, month - 1, 1)));
  const goNextRef = useRef(() => onMonthChange(new Date(year, month + 1, 1)));
  goPrevRef.current = () => onMonthChange(new Date(year, month - 1, 1));
  goNextRef.current = () => onMonthChange(new Date(year, month + 1, 1));

  const swipePan = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 30 && Math.abs(gs.dx) > Math.abs(gs.dy),
    onPanResponderMove: (_, gs) => { panX.setValue(gs.dx * 0.4); },
    onPanResponderRelease: (_, gs) => {
      if (gs.dx > 80) {
        Animated.timing(panX, { toValue: 400, duration: 180, useNativeDriver: true })
          .start(() => { panX.setValue(0); goPrevRef.current(); });
      } else if (gs.dx < -80) {
        Animated.timing(panX, { toValue: -400, duration: 180, useNativeDriver: true })
          .start(() => { panX.setValue(0); goNextRef.current(); });
      } else {
        Animated.spring(panX, { toValue: 0, useNativeDriver: true, bounciness: 0 }).start();
      }
    },
    onPanResponderTerminate: () => { Animated.spring(panX, { toValue: 0, useNativeDriver: true, bounciness: 0 }).start(); },
  }), [panX]);

  return (
    <Animated.View style={[styles.container, { transform: [{ translateX: panX }] }]} {...swipePan.panHandlers}>
      {/* Header */}
      <View style={styles.header}>
        <PressableScale onPress={() => onMonthChange(new Date(year, month - 1, 1))} style={styles.navBtn}>
          <View style={{ transform: [{ rotate: '180deg' }] }}><Icon name="chevron" size={18} color={Colors.primary} /></View>
        </PressableScale>
        <Text style={styles.monthLabel}>{year}年 {MONTHS[month]}</Text>
        <PressableScale onPress={() => onMonthChange(new Date(year, month + 1, 1))} style={styles.navBtn}>
          <Icon name="chevron" size={18} color={Colors.primary} />
        </PressableScale>
      </View>

      {/* Weekdays */}
      <View style={styles.weekRow}>
        {WEEKDAYS.map((w, i) => (
          <Text key={w} style={[styles.weekday, (i === 0 || i === 6) && styles.weekendLabel]}>{w}</Text>
        ))}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {(['period', 'follicular', 'ovulation', 'luteal'] as Phase[]).map(p => (
          <View key={p} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: PHASE_COLORS[p] }]} />
            <Text style={styles.legendText}>{PHASE_LABELS[p]}</Text>
          </View>
        ))}
      </View>

      {/* Grid */}
      <View style={styles.grid}>
        {rows.map((row, rowIdx) => (
          <View key={rowIdx} style={styles.gridRow}>
            {row.map((d, colIdx) => {
              if (d === null) return <View key={`e${rowIdx}-${colIdx}`} style={styles.dayCell} />;
              const date = new Date(year, month, d);
              const dateStr = formatDate(date);
              const info = phaseMap.get(dateStr);
              const isSelected = isSameDay(date, selectedDate);
              const bgColor = info?.fertility ? FERTILITY_COLOR : (info ? PHASE_COLORS[info.phase] : 'transparent');
              const isRecorded = recordDateSet.has(dateStr);

              return (
                <PressableScale key={d}
                  style={[styles.dayCell, { backgroundColor: bgColor }, isSelected && styles.selectedCell]}
                  onPress={() => onDayPress(date)}
                >
                  <Text style={[styles.dayNum, isSelected && styles.selectedText]}>
                    {d}
                  </Text>
                  {isRecorded && (
                    <View style={styles.recordDot} />
                  )}
                </PressableScale>
              );
            })}
          </View>
        ))}
      </View>

      {/* Swipe hint */}
      <Text style={styles.swipeHint}>左右滑动切换月份</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.cardBg, borderRadius: Radius.xl,
    padding: Spacing.lg, marginBottom: Spacing.cardGap, ...Shadow.card,
  },

  /* Header */
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  navBtn: { width: 32, height: 32, borderRadius: Radius.full, backgroundColor: Colors.primaryBg, alignItems: 'center', justifyContent: 'center' },
  monthLabel: { fontSize: FontSize.base, fontWeight: Weight.bold, color: Colors.text },

  /* Weekdays */
  weekRow: { flexDirection: 'row', marginBottom: Spacing.sm },
  weekday: { flex: 1, textAlign: 'center', fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: Weight.medium },
  weekendLabel: { color: Colors.primaryLight },

  /* Legend */
  legend: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.md, marginBottom: Spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: FontSize.xs, color: Colors.textMuted },

  /* Grid */
  grid: { gap: 3 },
  gridRow: { flexDirection: 'row', gap: 3 },
  dayCell: {
    flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center',
    borderRadius: Radius.md, minHeight: 36,
  },
  dayNum: { fontSize: 14, color: Colors.ink, fontWeight: Weight.medium },
  selectedCell: { borderWidth: 2, borderColor: Colors.ink, borderRadius: Radius.md },
  selectedText: { fontWeight: Weight.extrabold, color: Colors.ink },

  /* Record dot */
  recordDot: {
    position: 'absolute', bottom: 3, width: 5, height: 5,
    borderRadius: Radius.xxs, backgroundColor: Colors.danger,
  },

  /* Swipe */
  swipeHint: { textAlign: 'center', marginTop: Spacing.sm, fontSize: FontSize.xs, color: Colors.textHint },
});
