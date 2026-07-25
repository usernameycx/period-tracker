import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { usePeriod } from '../context/PeriodContext';
import { useCurrentPhaseOrDefault } from '../hooks/useCurrentPhase';
import { getAveragePeriodDays } from '../services/prediction';
import { PHASE_LABELS, PHASE_ICONS, OVULATION_BEFORE_PERIOD, OVULATION_SPAN, PHASE_COLORS } from '../constants/phases';
import { Colors, Spacing, FontSize, Radius, Shadow, Weight, LineHeight } from '../constants/theme';
import { todayStr, parseDate, diffDays } from '../utils/date';
import Icon from './Icon';
import PressableScale from './PressableScale';
import ConfirmModal from './ConfirmModal';

function computeCountdowns(phaseInfo: { phase: string; dayOffset: number; daysUntilPeriod: number }) {
  const OV_START = OVULATION_BEFORE_PERIOD + Math.floor(OVULATION_SPAN / 2);
  const daysUntilPeriod = phaseInfo.daysUntilPeriod;
  let daysUntilOvulation: number | null = null;
  switch (phaseInfo.phase) {
    case 'period':
      daysUntilOvulation = Math.max(0, OV_START - Math.floor(OVULATION_SPAN / 2) - phaseInfo.dayOffset);
      break;
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
  const { records, loading, addRecord, updateEndDate } = usePeriod();
  const phaseInfo = useCurrentPhaseOrDefault();
  const today = todayStr();
  const alreadyRecorded = records.some(r => r.start_date === today);
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const firstRecordDate = useMemo(
    () => records.length > 0
      ? [...records].sort((a, b) => a.start_date.localeCompare(b.start_date))[0].start_date
      : '',
    [records]
  );

  // Check if currently in an ongoing period (start recorded, no end_date)
  const ongoingRecord = useMemo(() => {
    const sorted = [...records].sort((a, b) => b.start_date.localeCompare(a.start_date));
    return sorted.find(r => !r.end_date) || null;
  }, [records]);
  const isPeriodOngoing = phaseInfo?.phase === 'period' && !!ongoingRecord &&
    (() => {
      const len = diffDays(parseDate(today), parseDate(ongoingRecord.start_date)) + 1;
      return len >= 2 && len <= 9;
    })();

  const avgPeriodDays = getAveragePeriodDays(records);

  if (loading || records.length === 0) {
    return null;
  }
  if (!phaseInfo) {
    return (
      <View style={styles.placeholderCard}>
        <View style={styles.placeholderIconWrap}>
          <Icon name="calendar" size={28} color={Colors.white} />
        </View>
        <Text style={styles.placeholderTitle}>今日暂无周期数据</Text>
        <Text style={styles.placeholderDesc}>已记录经期从 {firstRecordDate} 开始</Text>
      </View>
    );
  }

  const phaseDuration = (() => {
    switch (phaseInfo.phase) {
      case 'period': return avgPeriodDays;
      case 'ovulation': return OVULATION_SPAN;
      case 'luteal': return OVULATION_BEFORE_PERIOD;
      case 'follicular': {
        // Follicular = from period end to the day before ovulation
        // In a default 28-day cycle: 28 - avgPeriodDays - OVULATION_SPAN - OVULATION_BEFORE_PERIOD would be 28-5-1-14=8
        // But cycle length varies, so we use OVULATION_BEFORE_PERIOD as the anchor
        return Math.max(1, OVULATION_BEFORE_PERIOD - avgPeriodDays - 1);
      }
    }
  })();

  const { daysUntilPeriod, daysUntilOvulation } = computeCountdowns(phaseInfo);

  const handleEndPeriod = async () => {
    if (!ongoingRecord) return;
    try {
      await updateEndDate(ongoingRecord.start_date, today);
    } catch (e: any) {
      setErrorMessage(e.message || '操作失败，请稍后再试');
      setErrorVisible(true);
    }
  };

  return (
    <View style={styles.card}>
      {/* Top accent bar */}
      <View style={[styles.accentBar, { backgroundColor: PHASE_COLORS[phaseInfo.phase] }]} />

      <View style={styles.heroRow}>
        <View style={styles.heroIconWrap}>
          <Icon name={PHASE_ICONS[phaseInfo.phase]} size={38} color={Colors.primary} />
        </View>
        <View style={styles.heroTextWrap}>
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
        {phaseInfo.phase === 'period' ? (
          <View style={[styles.countdownBox, { backgroundColor: Colors.dangerBg }]}>
            <Text style={[styles.countdownNum, { color: Colors.danger }]}>进行中</Text>
            <Text style={styles.countdownLbl}>经期第{phaseInfo.dayOffset}天</Text>
          </View>
        ) : daysUntilPeriod > 0 ? (
          <View style={styles.countdownBox}>
            <Text style={styles.countdownNum}>{daysUntilPeriod}天</Text>
            <Text style={styles.countdownLbl}>距离下次经期</Text>
          </View>
        ) : daysUntilPeriod <= 0 && daysUntilPeriod > -avgPeriodDays ? (
          <View style={[styles.countdownBox, { backgroundColor: Colors.dangerBg }]}>
            <Text style={[styles.countdownNum, { color: Colors.danger }]}>进行中</Text>
            <Text style={styles.countdownLbl}>经期第{-daysUntilPeriod + 1}天</Text>
          </View>
        ) : null}

        {daysUntilOvulation !== null && daysUntilOvulation > 0 && (
          <>
            <View style={styles.cdDivider} />
            <View style={styles.countdownBox}>
              <Text style={styles.countdownNum}>{daysUntilOvulation}天</Text>
              <Text style={styles.countdownLbl}>距离下次排卵</Text>
            </View>
          </>
        )}
        {daysUntilOvulation === 0 && (
          <>
            <View style={styles.cdDivider} />
            <View style={[styles.countdownBox, { backgroundColor: Colors.botanicalBg }]}>
              <Text style={[styles.countdownNum, { color: Colors.success }]}>进行中</Text>
              <Text style={styles.countdownLbl}>排卵日</Text>
            </View>
          </>
        )}
      </View>

      {/* End-period button for ongoing period */}
      {isPeriodOngoing && (
        <PressableScale style={styles.endPeriodBtn} onPress={handleEndPeriod}>
          <Icon name="check" size={16} color={Colors.white} />
          <Text style={styles.endPeriodText}>经期结束了</Text>
        </PressableScale>
      )}

      {!alreadyRecorded && phaseInfo.phase !== 'period' && (
        <PressableScale style={styles.quickBtn} onPress={async () => {
          try { await addRecord(today); } catch (e: any) {
            setErrorMessage(e.message || '标记失败，请稍后再试');
            setErrorVisible(true);
          }
        }}>
          <Icon name="blood" size={18} color={Colors.white} />
          <Text style={styles.quickBtnText}>今天来了</Text>
        </PressableScale>
      )}

      <ConfirmModal
        visible={errorVisible}
        title="无法标记"
        message={errorMessage}
        icon="warning"
        variant="danger"
        cancelLabel="知道了"
        confirmLabel="知道了"
        onCancel={() => setErrorVisible(false)}
        onConfirm={() => setErrorVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  /* ── Placeholder (matches cold-start banner) ── */
  placeholderCard: {
    backgroundColor: Colors.primary, borderRadius: Radius.xl,
    padding: Spacing.xxxl, alignItems: 'center', marginBottom: Spacing.cardGap,
  },
  placeholderIconWrap: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.20)',
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md,
  },
  placeholderTitle: {
    fontSize: FontSize.base, fontWeight: Weight.extrabold, color: Colors.white,
    textAlign: 'center', marginBottom: Spacing.xs,
  },
  placeholderDesc: {
    fontSize: FontSize.sm2, color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
  },

  /* ── Card ── */
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    ...Shadow.raised,
    overflow: 'hidden',
  },
  accentBar: { height: 3, marginHorizontal: -Spacing.xl, marginTop: -Spacing.xl, marginBottom: Spacing.lg },
  heroTextWrap: { flex: 1 },
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
    ...Shadow.raised,
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

  /* ── End period ── */
  endPeriodBtn: {
    marginTop: Spacing.lg, backgroundColor: Colors.botanical,
    borderRadius: Radius.md, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', paddingVertical: Spacing.md, gap: Spacing.sm,
  },
  endPeriodText: { fontSize: FontSize.sm2, fontWeight: Weight.bold, color: Colors.white },
});
