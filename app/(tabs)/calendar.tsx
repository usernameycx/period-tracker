import React, { useState, useMemo, useCallback } from 'react';
import { View, ScrollView, Text, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import CalendarView from '../../src/components/CalendarView';
import DayDetailSheet from '../../src/components/DayDetailSheet';
import LunarCard from '../../src/components/LunarCard';
import PressableScale from '../../src/components/PressableScale';
import { useSelectedDate } from '../../src/context/SelectedDateContext';
import { usePeriod } from '../../src/context/PeriodContext';
import { useCurrentPhase } from '../../src/hooks/useCurrentPhase';
import { PHASE_LABELS, PHASE_ICONS } from '../../src/constants/phases';
import { Colors, Spacing, FontSize, Radius, Weight } from '../../src/constants/theme';
import { formatDate, addDays } from '../../src/utils/date';
import Icon from '../../src/components/Icon';

export default function CalendarPage() {
  const { selectedDate, setSelectedDate } = useSelectedDate();
  const { records } = usePeriod();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [sheetVisible, setSheetVisible] = useState(false);

  const phaseInfo = useCurrentPhase();
  const today = new Date();
  const todayStr = formatDate(today);

  // 周条始终锚定系统当前日期，不跟随选中日期
  const weekDays = useMemo(() => {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    return Array.from({ length: 7 }, (_, i) => addDays(startOfWeek, i));
  }, []);

  const weekDayLabels = ['日', '一', '二', '三', '四', '五', '六'];

  // 离开日历页再返回时，重置为当月 + 清选中
  useFocusEffect(
    useCallback(() => {
      setSelectedDate(new Date());
      setCurrentMonth(new Date());
    }, [setSelectedDate])
  );

  const handleDayPress = (d: Date) => {
    setSelectedDate(d);
    setSheetVisible(true);
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Week strip */}
        <View style={styles.weekStrip}>
          {weekDays.map((d, i) => {
            const ds = formatDate(d);
            const isToday = ds === todayStr;
            const isSel = ds === formatDate(selectedDate);
            const isRecorded = records.some(r => r.start_date === ds);
            return (
              <View key={i} style={styles.weekDay}>
                <Text style={[styles.weekLabel, (i === 0 || i === 6) && styles.weekLabelWknd]}>{weekDayLabels[i]}</Text>
                <View style={[styles.weekNumWrap, isToday && styles.weekNumToday]}>
                  <Text style={[styles.weekNum, isToday && styles.weekNumTodayText]}>{d.getDate()}</Text>
                  {isRecorded && <View style={styles.weekDot} />}
                </View>
              </View>
            );
          })}
        </View>

        {/* Today strip */}
        {records.length > 0 && phaseInfo && (
          <View style={styles.todayStrip}>
            <View style={styles.todayStripLeft}>
              <View style={styles.stripIcon}>
                <Icon name={PHASE_ICONS[phaseInfo.phase]} size={16} color={Colors.primary} />
              </View>
              <View>
                <Text style={styles.stripLabel}>今天</Text>
                <Text style={styles.stripVal}>{PHASE_LABELS[phaseInfo.phase]} · 第{phaseInfo.dayOffset}天</Text>
              </View>
            </View>
          </View>
        )}

        {records.length === 0 && (
          <View style={styles.emptyHint}>
            <Icon name="calendar" size={16} color={Colors.primary} />
            <Text style={styles.emptyHintText}>点击日期开始记录你的第一次经期</Text>
          </View>
        )}

        <CalendarView
          selectedDate={selectedDate}
          currentMonth={currentMonth}
          onDayPress={handleDayPress}
          onMonthChange={setCurrentMonth}
        />

        {/* Lunar card */}
        <LunarCard date={selectedDate} />

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <DayDetailSheet
        visible={sheetVisible}
        date={selectedDate}
        onClose={() => setSheetVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingTop: Spacing.pageTop, paddingHorizontal: Spacing.pageH, paddingBottom: Spacing.pageBottom },

  weekStrip: { flexDirection: 'row', marginBottom: Spacing.lg },
  weekDay: { flex: 1, alignItems: 'center', gap: 4 },
  weekLabel: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: Weight.medium },
  weekLabelWknd: { color: Colors.primaryLight },
  weekNumWrap: { width: 36, height: 36, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  weekNumToday: { backgroundColor: Colors.ink, borderRadius: Radius.md },
  weekNum: { fontSize: FontSize.sm2, fontWeight: Weight.medium, color: Colors.ink },
  weekNumTodayText: { color: Colors.white, fontWeight: Weight.bold },
  weekDot: { width: 5, height: 5, borderRadius: Radius.xxs, backgroundColor: Colors.danger, position: 'absolute', bottom: 3 },

  todayStrip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.cardBg, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.lg,
  },
  todayStripLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  stripIcon: { width: 36, height: 36, borderRadius: Radius.md, backgroundColor: Colors.primaryBg, alignItems: 'center', justifyContent: 'center' },
  stripLabel: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: Weight.medium },
  stripVal: { fontSize: FontSize.sm2, color: Colors.ink, fontWeight: Weight.bold, marginTop: 1 },

  emptyHint: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    backgroundColor: Colors.primaryBg, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.lg,
  },
  emptyHintText: { fontSize: FontSize.sm2, color: Colors.primary, fontWeight: Weight.semibold },
  bottomSpacer: { height: Spacing.xl },
});
