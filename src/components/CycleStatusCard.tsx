import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { usePeriod } from '../context/PeriodContext';
import { getNextPredictedStart, getAveragePeriodDays, getAverageCycleLength, getPhaseForDate } from '../services/prediction';
import { PHASE_LABELS, PHASE_EMOJI, OVULATION_BEFORE_PERIOD, OVULATION_SPAN, DEFAULT_PERIOD_DAYS, DEFAULT_CYCLE_DAYS } from '../constants/phases';
import { parseDate } from '../utils/date';

export default function CycleStatusCard() {
  const { records, loading } = usePeriod();

  if (loading || records.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.emoji}>📝</Text>
        <Text style={styles.emptyText}>还没有经期记录</Text>
        <Text style={styles.hint}>去日历页录入你的第一次经期吧~</Text>
      </View>
    );
  }

  const nextStart = getNextPredictedStart(records);
  const avgDays = getAveragePeriodDays(records);
  const cycleLength = getAverageCycleLength(records);
  const today = new Date();

  let phaseInfo;
  if (nextStart) {
    phaseInfo = getPhaseForDate(today, parseDate(nextStart), avgDays);
  } else {
    phaseInfo = { phase: 'follicular' as const, dayOffset: 1 };
  }

  // Compute phase duration for progress bar
  const phaseDuration = (() => {
    switch (phaseInfo.phase) {
      case 'period': return avgDays;
      case 'ovulation': return OVULATION_SPAN;
      case 'luteal': return OVULATION_BEFORE_PERIOD - Math.floor(OVULATION_SPAN / 2);
      case 'follicular': {
        const cl = cycleLength || DEFAULT_CYCLE_DAYS;
        const lutealDays = OVULATION_BEFORE_PERIOD - Math.floor(OVULATION_SPAN / 2);
        return Math.max(1, cl - avgDays - OVULATION_SPAN - lutealDays);
      }
    }
  })();

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.emoji}>{PHASE_EMOJI[phaseInfo.phase]}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.phaseLabel}>
            {PHASE_LABELS[phaseInfo.phase]} · 第{phaseInfo.dayOffset}天
          </Text>
          {nextStart && (
            <Text style={styles.nextText}>
              预计下次经期：{nextStart}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.progressBar}>
        <View style={[styles.progress, { width: `${Math.min(100, (phaseInfo.dayOffset / phaseDuration) * 100)}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 20,
    shadowColor: '#FFB6C1', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 3, marginBottom: 14,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  emoji: { fontSize: 36, marginRight: 14 },
  phaseLabel: { fontSize: 20, fontWeight: '700', color: '#FF69B4' },
  nextText: { fontSize: 13, color: '#999', marginTop: 4 },
  emptyText: { fontSize: 16, color: '#999', textAlign: 'center', marginTop: 8 },
  hint: { fontSize: 13, color: '#BBB', textAlign: 'center', marginTop: 4 },
  progressBar: { height: 4, backgroundColor: '#FFF0F3', borderRadius: 2, marginTop: 14 },
  progress: { height: 4, backgroundColor: '#FFB6C1', borderRadius: 2 },
});
