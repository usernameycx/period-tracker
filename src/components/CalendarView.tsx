import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { usePeriod } from '../context/PeriodContext';
import { getPhaseForCalendarDay } from '../services/prediction';
import { parseDate, formatDate, isSameDay } from '../utils/date';
import { Phase, PHASE_LABELS, PHASE_COLORS } from '../constants/phases';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../constants/theme';
import PressableScale from './PressableScale';

interface Props {
  onDayPress: (date: Date) => void;
  selectedDate: Date;
  currentMonth: Date;
  onMonthChange: (d: Date) => void;
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];
const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

/** Split array into chunks of `size` */
function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export default function CalendarView({ onDayPress, selectedDate, currentMonth, onMonthChange }: Props) {
  const { records } = usePeriod();

  const phaseMap = useMemo(() => {
    const map = new Map<string, { phase: Phase; dayOffset: number }>();
    if (records.length === 0) return map;

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const start = new Date(year, month - 1, 20);
    const end = new Date(year, month + 1, 10);
    const d = new Date(start);
    while (d <= end) {
      const info = getPhaseForCalendarDay(d, records);
      if (info) {
        map.set(formatDate(new Date(d)), info);
      }
      d.setDate(d.getDate() + 1);
    }
    return map;
  }, [records, currentMonth]);

  // Set of dates that have a period-start record (for dot markers)
  const recordDateSet = useMemo(() => {
    return new Set(records.map(r => r.start_date));
  }, [records]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = formatDate(new Date());

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  // Pad to multiple of 7 so every row has full cells, preventing last-row stretch
  while (days.length % 7 !== 0) days.push(null);

  const rows = chunk(days, 7);

  const goPrev = () => onMonthChange(new Date(year, month - 1, 1));
  const goNext = () => onMonthChange(new Date(year, month + 1, 1));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <PressableScale onPress={goPrev}><Text style={styles.nav}>‹</Text></PressableScale>
        <Text style={styles.monthLabel}>{year}年 {MONTHS[month]}</Text>
        <PressableScale onPress={goNext}><Text style={styles.nav}>›</Text></PressableScale>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAYS.map(w => <Text key={w} style={styles.weekday}>{w}</Text>)}
      </View>

      <View style={styles.legend}>
        {(['period', 'follicular', 'ovulation', 'luteal'] as Phase[]).map(p => (
          <View key={p} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: PHASE_COLORS[p] }, p === 'follicular' && styles.legendDotBorder]} />
            <Text style={styles.legendText}>{PHASE_LABELS[p]}</Text>
          </View>
        ))}
      </View>

      <View style={styles.grid}>
        {rows.map((row, rowIdx) => (
          <View key={rowIdx} style={styles.gridRow}>
            {row.map((d, colIdx) => {
              if (d === null) return <View key={`e${rowIdx}-${colIdx}`} style={styles.dayCell} />;
              const date = new Date(year, month, d);
              const dateStr = formatDate(date);
              const info = phaseMap.get(dateStr);
              const isToday = dateStr === todayStr;
              const isSelected = isSameDay(date, selectedDate);

              const bgColor = info ? PHASE_COLORS[info.phase] : 'transparent';
              const isRecorded = recordDateSet.has(dateStr);

              return (
                <PressableScale
                  key={d}
                  style={[styles.dayCell, { backgroundColor: bgColor }, isSelected && styles.selectedCell, isToday && styles.todayCell]}
                  onPress={() => onDayPress(date)}
                >
                  <Text style={[styles.dayNum, isSelected && styles.selectedText, isToday && styles.todayText]}>
                    {d}
                  </Text>
                  {isRecorded && <View style={[styles.recordDot, isSelected && styles.recordDotSelected]} />}
                </PressableScale>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.cardBg, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.cardGap,
    ...Shadow.card,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  nav: { fontSize: FontSize.xxl, color: Colors.primary, paddingHorizontal: Spacing.sm },
  monthLabel: { fontSize: FontSize.subtitle, fontWeight: '700', color: Colors.text },
  weekRow: { flexDirection: 'row', marginBottom: Spacing.xs },
  weekday: { flex: 1, textAlign: 'center', fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: '600' },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.md, marginBottom: Spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendDotBorder: { borderWidth: 1, borderColor: Colors.divider },
  legendText: { fontSize: FontSize.xs, color: Colors.textMuted },
  grid: { gap: 3 },
  gridRow: { flexDirection: 'row', gap: 3 },
  dayCell: {
    flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center',
    borderRadius: Radius.sm,
  },
  dayNum: { fontSize: 14, color: Colors.ink },
  selectedCell: { borderWidth: 2, borderColor: Colors.primary },
  selectedText: { color: Colors.primary, fontWeight: '700' },
  todayCell: { borderWidth: 2, borderColor: Colors.ink },
  todayText: { fontWeight: '700', color: Colors.ink },
  recordDot: {
    position: 'absolute',
    bottom: 3,
    width: 5, height: 5, borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  recordDotSelected: {
    backgroundColor: Colors.primary,
  },
});
