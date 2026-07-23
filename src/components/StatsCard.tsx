import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { usePeriod } from '../context/PeriodContext';
import { computeStats } from '../services/stats';
import { Colors, Spacing, FontSize, Radius, Shadow, Weight, LineHeight } from '../constants/theme';
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
        <Text style={styles.headerTitle}>周期统计</Text>
        {reg ? (
          <View style={[styles.regBadge, { backgroundColor: reg.bg, borderColor: reg.dot + '40' }]}>
            <View style={[styles.regDot, { backgroundColor: reg.dot }]} />
            <Text style={[styles.regLabel, { color: reg.dot }]}>{reg.label}</Text>
          </View>
        ) : null}
      </View>

      {/* Hero: avg cycle length */}
      <View style={styles.heroTile}>
        <Text style={styles.heroNum}>{stats.avgCycleLength ?? '-'}</Text>
        <View style={styles.heroMeta}>
          <Text style={styles.heroLabel}>天平均周期</Text>
          <Text style={styles.heroCount}>共 {stats.totalCycles} 个已完成周期</Text>
        </View>
      </View>

      {/* Cycle range bar */}
      {stats.minCycleLength && stats.maxCycleLength && (
        <View style={styles.rangeWrap}>
          <Text style={styles.rangeTitle}>周期范围</Text>
          <View style={styles.rangeRow}>
            <View style={styles.rangeEndpoint}>
              <Text style={styles.rangeVal}>{stats.minCycleLength}<Text style={styles.rangeUnit}>天</Text></Text>
              <Text style={styles.rangeSub}>最短</Text>
            </View>
            <View style={styles.rangeBarWrap}>
              <View style={styles.rangeTrack}>
                <View style={[styles.rangeFill, {
                  marginLeft: `${((stats.minCycleLength - 21) / 14) * 100}%`,
                  width: `${Math.max(10, ((stats.maxCycleLength - stats.minCycleLength) / 14) * 100)}%`,
                }]} />
              </View>
              <View style={styles.rangeLabels}>
                <Text style={styles.rangeTick}>21</Text>
                <Text style={styles.rangeTick}>28</Text>
                <Text style={styles.rangeTick}>35</Text>
              </View>
            </View>
            <View style={styles.rangeEndpoint}>
              <Text style={[styles.rangeVal, styles.rangeValRight]}>{stats.maxCycleLength}<Text style={styles.rangeUnit}>天</Text></Text>
              <Text style={[styles.rangeSub, { textAlign: 'right' }]}>最长</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.cardGap,
    ...Shadow.raised,
  },

  /* Header */
  headerRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  headerTitle: { fontSize: FontSize.base, fontWeight: Weight.bold, color: Colors.text, flex: 1 },

  regBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.sm, paddingVertical: 3,
    borderRadius: Radius.full, borderWidth: 1,
  },
  regDot: { width: 6, height: 6, borderRadius: 3 },
  regLabel: { fontSize: FontSize.xs, fontWeight: Weight.semibold },

  /* Hero tile */
  heroTile: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.lg,
    backgroundColor: Colors.primaryBg, borderRadius: Radius.lg,
    padding: Spacing.lg, marginBottom: Spacing.md,
  },
  heroNum: { fontSize: 40, fontWeight: Weight.extrabold, color: Colors.primary, letterSpacing: -2, lineHeight: 44 },
  heroMeta: { gap: 2 },
  heroLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: Weight.medium },
  heroCount: { fontSize: FontSize.xs, color: Colors.textMuted },

  /* Range bar */
  rangeWrap: { marginBottom: Spacing.lg },
  rangeTitle: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: Weight.semibold, marginBottom: Spacing.md },
  rangeRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm },
  rangeEndpoint: { minWidth: 36 },
  rangeVal: { fontSize: FontSize.lg, fontWeight: Weight.bold, color: Colors.ink },
  rangeValRight: { textAlign: 'right' },
  rangeUnit: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: Weight.medium },
  rangeSub: { fontSize: FontSize.xs, color: Colors.textHint },

  rangeBarWrap: { flex: 1, paddingBottom: 2 },
  rangeTrack: {
    height: 8, backgroundColor: Colors.inkBg, borderRadius: 4,
    overflow: 'hidden', marginBottom: Spacing.xs,
  },
  rangeFill: { height: 8, backgroundColor: Colors.botanical, borderRadius: 4 },
  rangeLabels: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
  rangeTick: { fontSize: 9, color: Colors.textHint },

  /* Period range chip */
  periodRange: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.cardBg, borderRadius: Radius.lg,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg,
    justifyContent: 'space-between',
    ...Shadow.raised,
  },
  periodRangeLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  periodRangeChip: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    backgroundColor: Colors.primaryBg, borderRadius: Radius.full,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  periodRangeText: { fontSize: FontSize.sm, fontWeight: Weight.semibold, color: Colors.text },

  /* Empty */
  emptyWrap: { alignItems: 'center', paddingVertical: Spacing.md },
  emptyIconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.cardBg, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.cardGap },
  emptyText: { fontSize: FontSize.sm2, color: Colors.textSecondary, textAlign: 'center', lineHeight: LineHeight.md },
  emptyHint: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.xs },
});
