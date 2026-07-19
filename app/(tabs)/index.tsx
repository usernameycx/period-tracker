import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, RefreshControl, AppState, Animated } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { Colors, Spacing, FontSize, Radius } from '../../src/constants/theme';

const COLLAPSED_KEY = 'home_sections_collapsed';

function SectionHeader({ icon, title, collapsed, onToggle }: {
  icon: IconName; title: string; collapsed: boolean; onToggle: () => void;
}) {
  const rotate = useRef(new Animated.Value(collapsed ? 0 : 1)).current;

  useEffect(() => {
    Animated.spring(rotate, {
      toValue: collapsed ? 0 : 1,
      speed: 14,
      bounciness: 4,
      useNativeDriver: true,
    }).start();
  }, [collapsed, rotate]);

  const rotation = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-90deg', '0deg'],
  });

  return (
    <PressableScale style={styles.sectionHeader} onPress={onToggle}>
      <Icon name={icon} size={18} color={Colors.primary} />
      <Text style={styles.sectionTitle}>{title}</Text>
      <Animated.View style={{ transform: [{ rotate: rotation }] }}>
        <Icon name="chevron-down" size={14} color={Colors.textHint} />
      </Animated.View>
    </PressableScale>
  );
}

export default function TodayPage() {
  const { refresh: refreshWeather } = useWeather();
  const { records, refresh: refreshPeriod } = usePeriod();
  const [refreshing, setRefreshing] = React.useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [refreshKey, setRefreshKey] = useState(0);
  const [now, setNow] = useState(() => new Date());

  // Tick every 60s so time-dependent text stays current without user action
  React.useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  // Load collapsed state on mount
  React.useEffect(() => {
    AsyncStorage.getItem(COLLAPSED_KEY).then(v => {
      if (v) setCollapsed(JSON.parse(v));
    }).catch(() => {});
  }, []);

  // Re-randomize greeting & lunar info on every focus (tab switch)
  useFocusEffect(useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []));

  // Also refresh when app comes back to foreground (time period may have changed)
  React.useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') setRefreshKey(k => k + 1);
    });
    return () => sub.remove();
  }, []);

  const toggleSection = useCallback((key: string) => {
    setCollapsed(prev => {
      const next = { ...prev, [key]: !prev[key] };
      AsyncStorage.setItem(COLLAPSED_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const greeting = useMemo(() => getGreeting(now, refreshKey), [now, refreshKey]);
  const lunarInfo = useMemo(() => getLunarData(now), [now]);

  const dayOfWeek = ['日', '一', '二', '三', '四', '五', '六'];
  const weekDay = dayOfWeek[now.getDay()];
  const normalDateStr = `${now.getMonth() + 1}月${now.getDate()}日 周${weekDay}`;

  // Map time period to icon — morning sun, afternoon sparkle, evening moon
  const greetingMap: Record<string, IconName> = { morning: 'sun', afternoon: 'sparkle', evening: 'moon' };
  const greetingIcon = greetingMap[greeting.period] || ('sparkle' as IconName);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refreshWeather(), refreshPeriod()]);
      setRefreshKey(k => k + 1); // re-randomize greeting & quote on pull-to-refresh
    } catch (e) {
      console.warn('Refresh failed:', e);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      {/* Daily opener */}
      <DailyQuoteCard refreshKey={refreshKey} date={now} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.greetingRow}>
          <Icon name={greetingIcon} size={26} color={Colors.primary} />
          <Text style={styles.greeting}>{greeting.text}</Text>
        </View>
        <Text style={styles.normalDate}>{normalDateStr}</Text>
        <Text style={styles.lunarDate}>
          {lunarInfo.monthChinese}月{lunarInfo.dayChinese} · {lunarInfo.yearGanZhi}年
        </Text>
      </View>

      {/* Cold start: guide new users to their first record */}
      {records.length === 0 && (
        <View style={styles.coldStartCard}>
          <Icon name="blood" size={28} color={Colors.primary} />
          <Text style={styles.coldStartTitle}>开始记录你的第一次经期</Text>
          <Text style={styles.coldStartDesc}>
            记录周期后，FayeTide 会为你预测下次经期、{'\n'}提供每日饮食建议和生活指南。
          </Text>
          <PressableScale
            style={styles.coldStartBtn}
            onPress={() => router.push('/(tabs)/calendar')}
          >
            <Icon name="calendar" size={18} color={Colors.white} />
            <Text style={styles.coldStartBtnText}>去日历记录</Text>
          </PressableScale>
        </View>
      )}

      {/* Core: cycle status */}
      <SectionHeader icon="cycle" title="周期状态" collapsed={!!collapsed['status']} onToggle={() => toggleSection('status')} />
      {!collapsed['status'] && <CycleStatusCard />}

      {/* Daily info */}
      <SectionHeader icon="weather" title="今日生活" collapsed={!!collapsed['life']} onToggle={() => toggleSection('life')} />
      {!collapsed['life'] && (
        <>
          <WeatherCard />
          <DietCard />
        </>
      )}

      {/* Stats */}
      <SectionHeader icon="stats" title="周期统计" collapsed={!!collapsed['stats']} onToggle={() => toggleSection('stats')} />
      {!collapsed['stats'] && <StatsCard />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingTop: Spacing.pageTop, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.pageBottom },

  header: { marginBottom: Spacing.sectionGap },
  greetingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  greeting: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.primary, flexShrink: 1 },
  normalDate: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.ink, marginTop: Spacing.sm },
  lunarDate: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },

  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginBottom: Spacing.md, marginTop: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textSecondary, flex: 1 },

  coldStartCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.sectionGap,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primaryLight,
    borderStyle: 'dashed',
  },
  coldStartTitle: {
    fontSize: FontSize.lg, fontWeight: '800', color: Colors.ink,
    marginTop: Spacing.md, textAlign: 'center',
  },
  coldStartDesc: {
    fontSize: FontSize.sm2, color: Colors.textSecondary,
    textAlign: 'center', lineHeight: 22, marginTop: Spacing.sm, marginBottom: Spacing.lg,
  },
  coldStartBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    paddingVertical: 14, paddingHorizontal: Spacing.xxl,
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
  },
  coldStartBtnText: { color: Colors.white, fontWeight: '700', fontSize: FontSize.base },
});
