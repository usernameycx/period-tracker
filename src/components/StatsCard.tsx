import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { usePeriod } from '../context/PeriodContext';
import { computeCycleStats } from '../services/stats';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../constants/theme';

const REGULARITY_DOT: Record<string, string> = {
  regular: Colors.success,
  slightly_irregular: Colors.warning,
  irregular: Colors.danger,
};

export default function StatsCard() {
  const { records } = usePeriod();
  const stats = useMemo(() => computeCycleStats(records), [records]);

  if (stats.totalCycles === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.emptyText}>
          需要至少2次经期记录才能生成统计数据{'\n'}当前已记录 {records.length} 次，再记 {2 - records.length} 次即可
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      {/* Hero stats — elevated white panel */}
      <View style={styles.heroPanel}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.totalCycles}</Text>
          <Text style={styles.statLabel}>已完成周期</Text>
        </View>
        <View style={styles.heroDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {stats.avgCycleLength ? `${stats.avgCycleLength}天` : '-'}
          </Text>
          <Text style={styles.statLabel}>平均周期</Text>
        </View>
        <View style={styles.heroDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: stats.regularity ? REGULARITY_DOT[stats.regularity] : Colors.accentWarm }]}>
            {stats.regularity ? stats.regularityLabel : '-'}
          </Text>
          <Text style={styles.statLabel}>规律性</Text>
        </View>
      </View>

      {/* Range bar — inset secondary panel */}
      {stats.minCycleLength && stats.maxCycleLength && (
        <View style={styles.rangePanel}>
          <View style={styles.rangeItem}>
            <Text style={styles.rangeLabel}>最短</Text>
            <Text style={styles.rangeValue}>{stats.minCycleLength}天</Text>
          </View>
          <View style={styles.rangeBar}>
            <View style={styles.rangeTrack}>
              <View
                style={[
                  styles.rangeFill,
                  {
                    marginLeft: `${((stats.minCycleLength - 21) / 14) * 100}%`,
                    width: `${((stats.maxCycleLength - stats.minCycleLength) / 14) * 100}%`,
                  },
                ]}
              />
            </View>
            <View style={styles.rangeLabels}>
              <Text style={styles.rangeMinMax}>21天</Text>
              <Text style={styles.rangeMinMax}>35天</Text>
            </View>
          </View>
          <View style={styles.rangeItem}>
            <Text style={styles.rangeLabel}>最长</Text>
            <Text style={styles.rangeValue}>{stats.maxCycleLength}天</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceWarm,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.cardGap,
    borderWidth: 1,
    borderColor: Colors.inkBg,
    ...Shadow.raised,
  },
  /* Hero stats — white elevated panel on warm card */
  heroPanel: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    ...Shadow.card,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: { fontSize: 24, fontWeight: '800', color: Colors.accentWarm },
  statLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 8 },
  heroDivider: { width: 1, alignSelf: 'stretch', backgroundColor: Colors.divider },

  /* Range — secondary inset on warm card */
  rangePanel: {
    marginTop: Spacing.md,
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.inkBg,
  },
  rangeItem: { alignItems: 'center', minWidth: 44 },
  rangeLabel: { fontSize: FontSize.xxs, color: Colors.textSecondary, marginBottom: 2 },
  rangeValue: { fontSize: FontSize.base, fontWeight: '800', color: Colors.ink },
  rangeBar: { flex: 1, marginHorizontal: Spacing.md },
  rangeTrack: { height: 6, backgroundColor: Colors.primaryBg, borderRadius: Radius.xs },
  rangeFill: { height: 6, backgroundColor: Colors.accentWarm, borderRadius: Radius.xs, minWidth: 6 },
  rangeLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.xs },
  rangeMinMax: { fontSize: FontSize.xxs, color: Colors.textHint },

  emptyText: { fontSize: FontSize.sm2, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginTop: Spacing.xs },
});
