import React, { useMemo, useState, useCallback } from 'react';
import { ScrollView, View, Text, StyleSheet, RefreshControl, AppState } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import PressableScale from '../../src/components/PressableScale';
import WeatherCard from '../../src/components/WeatherCard';
import CycleStatusCard from '../../src/components/CycleStatusCard';
import DietCard from '../../src/components/DietCard';
import DailyQuoteCard from '../../src/components/DailyQuoteCard';
import StatsCard from '../../src/components/StatsCard';
import { useWeather } from '../../src/context/WeatherContext';
import { usePeriod } from '../../src/context/PeriodContext';
import { getGreeting } from '../../src/services/greetings';
import { getLunarData } from '../../src/services/lunar';
import Icon, { IconName } from '../../src/components/Icon';
import { Colors, Spacing, FontSize, Radius, Weight, LineHeight, Shadow } from '../../src/constants/theme';

export default function TodayPage() {
  const { refresh: refreshWeather } = useWeather();
  const { records, loading, refresh: refreshPeriod } = usePeriod();
  const [refreshing, setRefreshing] = React.useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [now, setNow] = useState(() => new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  useFocusEffect(useCallback(() => { setRefreshKey(k => k + 1); }, []));

  React.useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') setRefreshKey(k => k + 1);
    });
    return () => sub.remove();
  }, []);

  const greeting = useMemo(() => getGreeting(now, refreshKey), [now, refreshKey]);
  const lunarInfo = useMemo(() => getLunarData(now), [now]);
  const greetingMap: Record<string, IconName> = { morning: 'sun', afternoon: 'sparkle', evening: 'moon' };
  const greetingIcon = greetingMap[greeting.period] || ('sparkle' as IconName);
  const dayOfWeek = ['日', '一', '二', '三', '四', '五', '六'];
  const weekDay = dayOfWeek[now.getDay()];
  const dateStr = `${now.getMonth() + 1}月${now.getDate()}日 周${weekDay}`;

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refreshWeather(), refreshPeriod()]);
      setRefreshKey(k => k + 1);
    } catch (e) { console.warn('Refresh failed:', e); }
    finally { setRefreshing(false); }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      {/* ── Compact header bar ── */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <Icon name={greetingIcon} size={16} color={Colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.greetingSm} numberOfLines={1}>{greeting.text}</Text>
            <Text style={styles.dateSm}>{dateStr}</Text>
          </View>
        </View>
        <Text style={styles.lunarSm} numberOfLines={1}>
          {lunarInfo.monthChinese}月{lunarInfo.dayChinese} · {lunarInfo.yearGanZhi}年
        </Text>
      </View>

      {/* ── Cold start banner (only when no records) ── */}
      {!loading && records.length === 0 && (
        <View style={styles.coldStart}>
          <View style={styles.coldStartIconWrap}>
            <Icon name="blood" size={40} color={Colors.white} />
          </View>
          <Text style={styles.coldStartTitle}>开始记录你的第一次经期</Text>
          <Text style={styles.coldStartDesc}>
            记录周期后，FayeTide 会为你预测下次经期、提供每日饮食建议和生活指南。
          </Text>
          <PressableScale style={styles.coldStartBtn} onPress={() => router.push('/(tabs)/calendar')}>
            <Icon name="calendar" size={18} color={Colors.white} />
            <Text style={styles.coldStartBtnText}>去日历记录</Text>
          </PressableScale>
        </View>
      )}

      {/* ── Cycle status ── */}
      <CycleStatusCard />

      {/* ── Quote ── */}
      <View style={styles.quoteWrap}>
        <DailyQuoteCard refreshKey={refreshKey} date={now} />
      </View>

      {/* ── Daily Guide ── */}
      <View style={styles.sectionLabel}>
        <View style={styles.sectionDot} />
        <Text style={styles.sectionLabelText}>今日生活</Text>
      </View>
      <WeatherCard />
      <DietCard />

      {/* ── Stats ── */}
      <View style={styles.sectionLabel}>
        <View style={[styles.sectionDot, { backgroundColor: Colors.warning }]} />
        <Text style={styles.sectionLabelText}>周期统计</Text>
      </View>
      <StatsCard />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingTop: Spacing.pageTop, paddingHorizontal: Spacing.pageH, paddingBottom: Spacing.pageBottom },

  /* ── Header bar ── */
  headerBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    marginBottom: Spacing.xl, paddingTop: Spacing.xs,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, flex: 1 },
  greetingSm: { fontSize: FontSize.md, fontWeight: Weight.semibold, color: Colors.text },
  dateSm: { fontSize: FontSize.xs, color: Colors.textMuted },
  lunarSm: { fontSize: FontSize.xs, color: Colors.textHint, flexShrink: 0 },

  quoteWrap: { marginVertical: Spacing.md },

  /* ── Hero section ── */
  heroSection: { marginBottom: Spacing.md },

  /* ── Cold start ── */
  coldStart: {
    backgroundColor: Colors.primary, borderRadius: Radius.xl,
    padding: Spacing.xxxl, marginBottom: Spacing.sectionGap, alignItems: 'center',
  },
  coldStartIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.20)',
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg,
  },
  coldStartTitle: {
    fontSize: FontSize.lg, fontWeight: Weight.extrabold, color: Colors.white,
    textAlign: 'center', marginBottom: Spacing.sm,
  },
  coldStartDesc: {
    fontSize: FontSize.sm2, color: 'rgba(255,255,255,0.80)',
    textAlign: 'center', lineHeight: LineHeight.md, marginBottom: Spacing.xl,
  },
  coldStartBtn: {
    backgroundColor: Colors.white, borderRadius: Radius.full,
    paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xxl,
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
  },
  coldStartBtnText: { color: Colors.primary, fontWeight: Weight.bold, fontSize: FontSize.base },

  /* ── Section labels ── */
  sectionLabel: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  sectionDot: { width: 8, height: 8, borderRadius: Radius.xs, backgroundColor: Colors.primary },
  sectionLabelText: { fontSize: FontSize.sm, fontWeight: Weight.bold, color: Colors.textMuted },
});
