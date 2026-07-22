import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { usePeriod } from '../context/PeriodContext';
import { useCurrentPhase } from '../hooks/useCurrentPhase';
import { getDailyQuote } from '../services/quotes';
import { Phase, PHASE_ICONS } from '../constants/phases';
import { Colors, Spacing, FontSize, Weight, Radius, LineHeight } from '../constants/theme';
import Icon from './Icon';
import type { IconName } from './Icon';

export default function DailyQuoteCard({ refreshKey = 0, date }: { refreshKey?: number; date?: Date }) {
  const { records, loading } = usePeriod();
  const phaseInfo = useCurrentPhase();
  const today = date ?? new Date();

  const { quote, phaseIcon } = useMemo(() => {
    if (records.length === 0) {
      return {
        quote: { text: '记录你的第一次经期，开始了解身体的节奏吧' },
        phaseIcon: 'leaf' as IconName,
      };
    }
    const phase: Phase = phaseInfo?.phase || 'follicular';
    const quote = getDailyQuote(today, phase, refreshKey);
    return { quote, phaseIcon: PHASE_ICONS[phase] };
  }, [records, phaseInfo, refreshKey, today]);

  if (loading) {
    return (
      <View style={[styles.row, styles.skeleton]}>
        <View style={{ marginTop: 3 }}><Icon name="leaf" size={14} color={Colors.primaryLight} /></View>
        <View style={styles.skeletonBar} />
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <View style={{ marginTop: 3 }}><Icon name={phaseIcon} size={14} color={Colors.primary} /></View>
      <Text style={styles.text} numberOfLines={2}>{quote.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.primaryBg,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  text: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: LineHeight.sm2,
    fontWeight: Weight.regular,
  },
  skeleton: { opacity: 0.5 },
  skeletonBar: {
    flex: 1,
    height: 14,
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.xs,
    opacity: 0.3,
  },
});
