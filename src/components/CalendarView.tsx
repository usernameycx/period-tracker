import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { usePeriod } from '../context/PeriodContext';
import { getNextPredictedStart } from '../services/prediction';
import { parseDate, formatDate, isSameDay } from '../utils/date';

interface Props {
  onDayPress: (date: Date) => void;
  selectedDate: Date;
  currentMonth: Date;
  onMonthChange: (d: Date) => void;
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];
const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

export default function CalendarView({ onDayPress, selectedDate, currentMonth, onMonthChange }: Props) {
  const { records } = usePeriod();

  const periodDates = useMemo(() => {
    const set = new Set<string>();
    records.forEach(r => {
      const start = parseDate(r.start_date);
      const end = parseDate(r.end_date);
      const d = new Date(start);
      while (d <= end) {
        set.add(formatDate(new Date(d)));
        d.setDate(d.getDate() + 1);
      }
    });
    return set;
  }, [records]);

  const ovulationDate = useMemo(() => {
    const next = getNextPredictedStart(records);
    if (!next) return null;
    const d = parseDate(next);
    d.setDate(d.getDate() - 14);
    return formatDate(d);
  }, [records]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const goPrev = () => onMonthChange(new Date(year, month - 1, 1));
  const goNext = () => onMonthChange(new Date(year, month + 1, 1));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goPrev}><Text style={styles.nav}>‹</Text></TouchableOpacity>
        <Text style={styles.monthLabel}>{year}年 {MONTHS[month]}</Text>
        <TouchableOpacity onPress={goNext}><Text style={styles.nav}>›</Text></TouchableOpacity>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAYS.map(w => <Text key={w} style={styles.weekday}>{w}</Text>)}
      </View>

      <View style={styles.grid}>
        {days.map((d, idx) => {
          if (d === null) return <View key={`e${idx}`} style={styles.dayCell} />;
          const date = new Date(year, month, d);
          const dateStr = formatDate(date);
          const isPeriod = periodDates.has(dateStr);
          const isOvulation = ovulationDate === dateStr;
          const isSelected = isSameDay(date, selectedDate);

          return (
            <TouchableOpacity key={d} style={[styles.dayCell, isSelected && styles.selectedCell]} onPress={() => onDayPress(date)}>
              <Text style={[styles.dayNum, isSelected && styles.selectedText]}>{d}</Text>
              {isPeriod && <View style={styles.periodDot} />}
              {isOvulation && <Text style={styles.flower}>{'🌸'}</Text>}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#FFF', borderRadius: 16, padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  nav: { fontSize: 28, color: '#FF69B4', paddingHorizontal: 8 },
  monthLabel: { fontSize: 17, fontWeight: '700', color: '#333' },
  weekRow: { flexDirection: 'row', marginBottom: 8 },
  weekday: { flex: 1, textAlign: 'center', fontSize: 13, color: '#999', fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dayNum: { fontSize: 15, color: '#333' },
  selectedCell: { backgroundColor: '#FFB6C1', borderRadius: 20 },
  selectedText: { color: '#FFF', fontWeight: '700' },
  periodDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF69B4', marginTop: 2 },
  flower: { position: 'absolute', bottom: 4, fontSize: 10 },
});
