import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { usePeriod } from '../context/PeriodContext';
import { useCurrentPhaseOrDefault } from '../hooks/useCurrentPhase';
import { PHASE_LABELS, PHASE_ICONS, OVULATION_BEFORE_PERIOD, OVULATION_SPAN, DEFAULT_PERIOD_DAYS, PHASE_COLORS } from '../constants/phases';
import { Colors, Spacing, FontSize, Radius, Shadow, Weight, LineHeight } from '../constants/theme';
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
    return null;
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
    <View style={styles.card}>
      {/* Top accent bar */}
      <View style={[styles.accentBar, { backgroundColor: PHASE_COLORS[phaseInfo.phase] }]} />

      <View style={styles.heroRow}>
        <View style={styles.heroIconWrap}>
          <Icon name={PHASE_ICONS[phaseInfo.phase]} size={38} color={Colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.phaseLabel}>
            {PHASE_LABELS[phaseInfo.phase]} · 第{phaseInfo.dayOffset}天
          </Text>
          <Text style={styles.nextText}>
            预计下次经期：{phaseInfo.nextPeriodDate}
          </Text>
        </View>
      </View>

      {/* Progress */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.min(100, (phaseInfo.dayOffset / phaseDuration) * 100)}%` }]} />
      </View>
      <Text style={styles.progressHint}>本阶段已过 {Math.round((phaseInfo.dayOffset / phaseDuration) * 100)}%</Text>

      {/* Countdown */}
      <View style={styles.countdownRow}>
        {daysUntilPeriod > 0 && (
          <View style={styles.countdownBox}>
            <Text style={styles.countdownNum}>{daysUntilPeriod}</Text>
            <Text style={styles.countdownLbl}>天后经期</Text>
          </View>
        )}
        {daysUntilPeriod <= 0 && daysUntilPeriod > -DEFAULT_PERIOD_DAYS && (
          <View style={[styles.countdownBox, { backgroundColor: Colors.dangerBg }]}>
            <Text style={[styles.countdownNum, { color: Colors.danger }]}>进行中</Text>
            <Text style={styles.countdownLbl}>经期第{-daysUntilPeriod + 1}天</Text>
          </View>
        )}

        {daysUntilOvulation !== null && daysUntilOvulation > 0 && (
          <>
            <View style={styles.cdDivider} />
            <View style={styles.countdownBox}>
              <Text style={styles.countdownNum}>{daysUntilOvulation}</Text>
              <Text style={styles.countdownLbl}>天后排卵</Text>
            </View>
          </>
        )}
        {daysUntilOvulation === 0 && (
          <>
            <View style={styles.cdDivider} />
            <View style={[styles.countdownBox, { backgroundColor: Colors.botanicalBg }]}>
              <Text style={[styles.countdownNum, { color: Colors.success }]}>进行中</Text>
              <Text style={styles.countdownLbl}>排卵期</Text>
            </View>
          </>
        )}
      </View>

      {!alreadyRecorded && phaseInfo.phase !== 'period' && (
        <PressableScale style={styles.quickBtn} onPress={async () => {
          try { await addRecord(today); } catch (e: any) { Alert.alert('无法标记', e.message); }
        }}>
          <Icon name="blood" size={18} color={Colors.white} />
          <Text style={styles.quickBtnText}>今天来了</Text>
        </PressableScale>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  /* ── Empty state ── */
  emptyCard: {
    backgroundColor: Colors.cardBg, borderRadius: Radius.xl,
    padding: Spacing.xxl, alignItems: 'center', ...Shadow.card,
  },
  emptyIconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md,
  },
  emptyTitle: { fontSize: FontSize.base, fontWeight: Weight.semibold, color: Colors.text, marginBottom: Spacing.xs },
  emptySubtitle: { fontSize: FontSize.sm2, color: Colors.textMuted, textAlign: 'center' },
  emptyHint: { fontSize: FontSize.sm2, color: Colors.textMuted, textAlign: 'center', lineHeight: LineHeight.md },

  /* ── Card ── */
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    ...Shadow.raised,
    overflow: 'hidden',
  },
  accentBar: { height: 3, marginHorizontal: -Spacing.xl, marginTop: -Spacing.xl, marginBottom: Spacing.lg },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    marginBottom: Spacing.md,
  },
  heroIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.primary + '20',
  },
  phaseLabel: { fontSize: FontSize.xl, fontWeight: Weight.extrabold, color: Colors.ink, lineHeight: LineHeight.xl },
  nextText: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },

  /* ── Empty ── */
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm },
  hint: { fontSize: FontSize.sm, color: Colors.textHint, textAlign: 'center', marginTop: Spacing.xs },

  /* ── Progress ── */
  progressTrack: { height: 8, backgroundColor: Colors.primaryBg, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 8, backgroundColor: Colors.primary, borderRadius: 4 },
  progressHint: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'right', marginTop: 4 },

  /* ── Countdown ── */
  countdownRow: { flexDirection: 'row', marginTop: Spacing.lg },
  countdownBox: {
    flex: 1, alignItems: 'center', paddingVertical: Spacing.lg,
    backgroundColor: Colors.primaryBg, borderRadius: Radius.md,
  },
  cdDivider: { width: Spacing.md, alignSelf: 'stretch' },
  countdownNum: { fontSize: 36, fontWeight: Weight.extrabold, color: Colors.ink, letterSpacing: -1 },
  countdownLbl: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },

  /* ── Quick mark ── */
  quickBtn: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: Spacing.md, gap: Spacing.sm,
  },
  quickBtnText: { color: Colors.white, fontWeight: Weight.bold, fontSize: FontSize.base },
});
