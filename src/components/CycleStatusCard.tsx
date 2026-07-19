import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { usePeriod } from '../context/PeriodContext';
import { useCurrentPhaseOrDefault } from '../hooks/useCurrentPhase';
import { PHASE_LABELS, PHASE_ICONS, OVULATION_BEFORE_PERIOD, OVULATION_SPAN, DEFAULT_PERIOD_DAYS } from '../constants/phases';
import { Colors, Spacing, FontSize, Radius, sharedCard } from '../constants/theme';
import { todayStr } from '../utils/date';
import Icon from './Icon';
import PressableScale from './PressableScale';

function computeCountdowns(phaseInfo: { phase: string; dayOffset: number; daysUntilPeriod: number }) {
  const OV_START = OVULATION_BEFORE_PERIOD + Math.floor(OVULATION_SPAN / 2);
  const daysUntilPeriod = phaseInfo.daysUntilPeriod;
  let daysUntilOvulation: number | null = null;
  switch (phaseInfo.phase) {
    case 'period':
    case 'follicular':
      daysUntilOvulation = daysUntilPeriod > OV_START ? daysUntilPeriod - OV_START : 0;
      break;
    case 'ovulation':
      daysUntilOvulation = 0;
      break;
    case 'luteal':
      daysUntilOvulation = null;
      break;
  }
  return { daysUntilPeriod, daysUntilOvulation };
}

export default function CycleStatusCard() {
  const { records, loading, addRecord } = usePeriod();
  const phaseInfo = useCurrentPhaseOrDefault();
  const today = todayStr();
  const alreadyRecorded = records.some(r => r.start_date === today);

  if (loading || records.length === 0) {
    return (
      <View style={sharedCard.prominent}>
        <Icon name="clipboard" size={36} color={Colors.primaryLight} />
        <Text style={styles.emptyText}>还没有经期记录</Text>
        <Text style={styles.hint}>去日历页录入你的第一次经期吧~</Text>
      </View>
    );
  }

  const phaseDuration = (() => {
    switch (phaseInfo.phase) {
      case 'period': return DEFAULT_PERIOD_DAYS;
      case 'ovulation': return OVULATION_SPAN;
      case 'luteal': return OVULATION_BEFORE_PERIOD - Math.floor(OVULATION_SPAN / 2);
      case 'follicular': {
        const afterPeriod = OVULATION_BEFORE_PERIOD + Math.floor(OVULATION_SPAN / 2);
        return Math.max(1, afterPeriod - DEFAULT_PERIOD_DAYS);
      }
    }
  })();

  const { daysUntilPeriod, daysUntilOvulation } = computeCountdowns(phaseInfo);

  return (
    <View style={[sharedCard.prominent, styles.prominentCard]}>
      <View style={styles.row}>
        <Icon name={PHASE_ICONS[phaseInfo.phase]} size={36} color={Colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.phaseLabel}>
            {PHASE_LABELS[phaseInfo.phase]} · 第{phaseInfo.dayOffset}天
          </Text>
          <Text style={styles.nextText}>
            预计下次经期：{phaseInfo.nextPeriodDate}
          </Text>
        </View>
      </View>
      <View style={styles.progressBar}>
        <View style={[styles.progress, { width: `${Math.min(100, (phaseInfo.dayOffset / phaseDuration) * 100)}%` }]} />
      </View>

      <View style={styles.countdownRow}>
        {daysUntilPeriod > 0 && (
          <View style={styles.countdownItem}>
            <Icon name="blood" size={22} color={Colors.primary} />
            <View>
              <Text style={styles.countdownNumber}>{daysUntilPeriod}</Text>
              <Text style={styles.countdownLabel}>天后经期</Text>
            </View>
          </View>
        )}
        {daysUntilPeriod <= 0 && daysUntilPeriod > -DEFAULT_PERIOD_DAYS && (
          <View style={styles.countdownItem}>
            <Icon name="blood" size={22} color={Colors.danger} />
            <View>
              <Text style={styles.countdownNumber}>进行中</Text>
              <Text style={styles.countdownLabel}>经期第{-daysUntilPeriod + 1}天</Text>
            </View>
          </View>
        )}

        {daysUntilOvulation !== null && daysUntilOvulation > 0 && (
          <View style={styles.countdownItem}>
            <Icon name="egg" size={22} color={Colors.primaryLight} />
            <View>
              <Text style={styles.countdownNumber}>{daysUntilOvulation}</Text>
              <Text style={styles.countdownLabel}>天后排卵</Text>
            </View>
          </View>
        )}
        {daysUntilOvulation === 0 && (
          <View style={styles.countdownItem}>
            <Icon name="egg" size={22} color={Colors.accentWarm} />
            <View>
              <Text style={styles.countdownNumber}>进行中</Text>
              <Text style={styles.countdownLabel}>排卵期</Text>
            </View>
          </View>
        )}
      </View>

      {/* Quick mark: one-tap period start when not in period and not already recorded today */}
      {!alreadyRecorded && phaseInfo.phase !== 'period' && (
        <PressableScale
          style={styles.quickMarkBtn}
          onPress={() => addRecord(today)}
        >
          <Icon name="blood" size={18} color={Colors.white} />
          <Text style={styles.quickMarkText}>今天来了</Text>
        </PressableScale>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  prominentCard: { backgroundColor: Colors.cardBg, borderColor: Colors.primaryLight, borderWidth: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  phaseLabel: { fontSize: FontSize.title, fontWeight: '700', color: Colors.ink },
  nextText: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 4 },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm },
  hint: { fontSize: FontSize.sm, color: Colors.textHint, textAlign: 'center', marginTop: Spacing.xs },
  progressBar: { height: 6, backgroundColor: Colors.primaryBg, borderRadius: 3, marginTop: 14 },
  progress: { height: 6, backgroundColor: Colors.primary, borderRadius: 3 },
  countdownRow: { flexDirection: 'row', marginTop: 14, gap: Spacing.md },
  countdownItem: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.primaryBg, borderRadius: Radius.md, padding: Spacing.md, gap: 10,
  },
  countdownNumber: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.ink },
  countdownLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 1 },
  quickMarkBtn: {
    marginTop: Spacing.md,
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, gap: Spacing.sm,
  },
  quickMarkText: { color: Colors.white, fontWeight: '700', fontSize: FontSize.base },
});
