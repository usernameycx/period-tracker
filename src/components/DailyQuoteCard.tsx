import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { usePeriod } from '../context/PeriodContext';
import { useCurrentPhase } from '../hooks/useCurrentPhase';
import { getDailyQuote } from '../services/quotes';
import { Phase, PHASE_ICONS } from '../constants/phases';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../constants/theme';
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

  if (loading) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.quoteMark}>"</Text>
      <View style={styles.content}>
        <Icon name={phaseIcon} size={22} color={Colors.primary} />
        <Text style={styles.text}>{quote.text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceWarm,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.cardGap,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.inkBg,
    ...Shadow.raised,
  },
  quoteMark: {
    fontSize: 40,
    fontWeight: '300',
    color: Colors.accentWarm,
    opacity: 0.25,
    lineHeight: 36,
    marginTop: -2,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  text: { flex: 1, fontSize: FontSize.md, color: Colors.textSecondary, lineHeight: 22, fontWeight: '500' },
});
