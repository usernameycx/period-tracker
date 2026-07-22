import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { usePeriod } from '../context/PeriodContext';
import { computeStats } from '../services/stats';
import { Colors, Spacing, FontSize, Radius, Weight, LineHeight } from '../constants/theme';
import Icon from './Icon';

const REGULARITY_STYLE: Record<string, { dot: string; bg: string; label: string }> = {
  regular: { dot: Colors.success, bg: Colors.botanicalBg, label: '规律' },
  slightly_irregular: { dot: Colors.warning, bg: Colors.warningBg, label: '基本规律' },
  irregular: { dot: Colors.danger, bg: Colors.dangerBg, label: '不规律' },
  unknown: { dot: Colors.textMuted, bg: Colors.inkBg, label: '数据不足' },
};

export default function StatsCard() {
  const { records } = usePeriod();
  const stats = useMemo(() => computeStats(records), [records]);

  if (stats.totalCycles === 0) {
    return (
      <View style={styles.card}>
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIconWrap}>
            <Icon name="stats" size={28} color={Colors.primaryLight} />
          </View>
          <Text style={styles.emptyText}>需要至少2次经期记录才能生成统计数据</Text>
          <Text style={styles.emptyHint}>当前已记录 {records.length} 次，再记 {2 - records.length} 次即可</Text>
        </View>
      </View>
    );
  }

  const reg = stats.regularity ? REGULARITY_STYLE[stats.regularity] : null;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Icon name="stats" size={16} color={Colors.primary} />
      </View>

      {/* Hero stat */}
      <View style={styles.heroStat}>
        <Text style={styles.heroNum}>{stats.avgCycleLength ?? '-'}</Text>
        <Text style={styles.heroUnit}>天</Text>
      </View>
      <Text style={styles.heroDesc}>平均周期长度</Text>

      {/* Info row: cycles + regularity */}
      <View style={styles.infoRow}>
        <Text style={styles.infoText}>{stats.totalCycles} 个已完成周期</Text>
        {reg ? (
          <View style={[styles.regBadge, { backgroundColor: reg.bg, borderColor: reg.dot + '40' }]}>
            <View style={[styles.regDot, { backgroundColor: reg.dot }]} />
            <Text style={[styles.regLabel, { color: reg.dot }]}>{reg.label}</Text>
          </View>
        ) : (
          <Text style={styles.infoText}>{stats.regularityLabel}</Text>
        )}
      </View>

      {/* Range bar */}
      {stats.minCycleLength && stats.maxCycleLength && (
        <View style={styles.rangeWrap}>
          <View style={styles.rangeEnds}>
            <Text style={styles.rangeEndVal}>{stats.minCycleLength}<Text style={styles.rangeEndUnit}>天</Text></Text>
            <Text style={styles.rangeEndVal}>{stats.maxCycleLength}<Text style={styles.rangeEndUnit}>天</Text></Text>
          </View>
          <View style={styles.rangeTrack}>
            <View style={[styles.rangeFill, {
              marginLeft: `${((stats.minCycleLength - 21) / 14) * 100}%`,
              width: `${Math.max(4, ((stats.maxCycleLength - stats.minCycleLength) / 14) * 100)}%`,
            }]} />
          </View>
          <View style={styles.rangeEnds}>
            <Text style={styles.rangeEndLbl}>最短</Text>
            <Text style={styles.rangeEndLbl}>最长</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.primaryBg,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.cardGap,
  },

  /* Header */
  headerRow: { marginBottom: Spacing.lg },

  /* Hero stat */
  heroStat: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: Spacing.xs, marginBottom: Spacing.xs },
  heroNum: { fontSize: 48, fontWeight: Weight.extrabold, color: Colors.primary, letterSpacing: -2 },
  heroUnit: { fontSize: FontSize.base, fontWeight: Weight.semibold, color: Colors.textMuted },
  heroDesc: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center', marginBottom: Spacing.xl },

  /* Info row */
  infoRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.cardBg, borderRadius: Radius.lg,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg,
  },
  infoText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: Weight.medium },
  regBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radius.full, borderWidth: 1 },
  regDot: { width: 6, height: 6, borderRadius: 3 },
  regLabel: { fontSize: FontSize.xs, fontWeight: Weight.semibold },

  /* Range */
  rangeWrap: { backgroundColor: Colors.cardBg, borderRadius: Radius.lg, padding: Spacing.lg },
  rangeEnds: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  rangeEndVal: { fontSize: FontSize.base, fontWeight: Weight.bold, color: Colors.ink },
  rangeEndUnit: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: Weight.medium },
  rangeEndLbl: { fontSize: FontSize.xs, color: Colors.textHint },
  rangeTrack: { height: 6, backgroundColor: Colors.inkBg, borderRadius: 3, overflow: 'hidden' },
  rangeFill: { height: 6, backgroundColor: Colors.botanical, borderRadius: 3 },

  /* Empty */
  emptyWrap: { alignItems: 'center', paddingVertical: Spacing.md },
  emptyIconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.cardBg, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.cardGap },
  emptyText: { fontSize: FontSize.sm2, color: Colors.textSecondary, textAlign: 'center', lineHeight: LineHeight.md },
  emptyHint: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.xs },
});
