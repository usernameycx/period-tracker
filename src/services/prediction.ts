import { PeriodRecord } from '../db/period-records';
import { Phase, DEFAULT_PERIOD_DAYS, OVULATION_BEFORE_PERIOD, OVULATION_SPAN, MIN_RECORDS_FOR_PREDICTION } from '../constants/phases';
import { parseDate, diffDays, addDays, formatDate } from '../utils/date';

export function getAveragePeriodDays(records: PeriodRecord[]): number {
  if (records.length === 0) return DEFAULT_PERIOD_DAYS;
  const durations = records.map(r => {
    const d = diffDays(parseDate(r.end_date), parseDate(r.start_date)) + 1;
    return d > 0 ? d : DEFAULT_PERIOD_DAYS;
  });
  return Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
}

export function getAverageCycleLength(records: PeriodRecord[]): number | null {
  if (records.length < MIN_RECORDS_FOR_PREDICTION) return null;
  const sorted = [...records].sort((a, b) => a.start_date.localeCompare(b.start_date));
  const lengths: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    lengths.push(diffDays(parseDate(sorted[i].start_date), parseDate(sorted[i - 1].start_date)));
  }
  if (lengths.length === 0) return null;

  // 加权平均：越近的权重越高
  let weightedSum = 0;
  let weightSum = 0;
  for (let i = 0; i < lengths.length; i++) {
    const weight = i + 1; // 最早权重1，最新权重=lengths.length
    weightedSum += lengths[i] * weight;
    weightSum += weight;
  }
  return Math.round(weightedSum / weightSum);
}

export function predictNextPeriod(records: PeriodRecord[]): Date | null {
  const cycleLength = getAverageCycleLength(records);
  if (cycleLength === null) return null;
  const sorted = [...records].sort((a, b) => b.start_date.localeCompare(a.start_date));
  const lastStart = parseDate(sorted[0].start_date);
  return addDays(lastStart, cycleLength);
}

export function getNextPredictedStart(records: PeriodRecord[]): string | null {
  const d = predictNextPeriod(records);
  return d ? formatDate(d) : null;
}

export function getPhaseForDate(
  date: Date,
  predictedNextStart: Date,
  avgPeriodDays: number
): { phase: Phase; dayOffset: number } {
  const daysUntilPeriod = diffDays(predictedNextStart, date);

  // 当前正处于经期：从 predictedNextStart 开始，持续 avgPeriodDays 天
  // daysUntilPeriod=0 → day 1, daysUntilPeriod=-1 → day 2, ...
  if (daysUntilPeriod <= 0 && daysUntilPeriod > -avgPeriodDays) {
    return { phase: 'period', dayOffset: -daysUntilPeriod + 1 };
  }

  // 排卵期：下次经期前 OVULATION_BEFORE_PERIOD 天，前后各 (OVULATION_SPAN-1)/2 天
  const ovulationStart = OVULATION_BEFORE_PERIOD + Math.floor(OVULATION_SPAN / 2);
  const ovulationEnd = OVULATION_BEFORE_PERIOD - Math.floor(OVULATION_SPAN / 2);
  if (daysUntilPeriod <= ovulationStart && daysUntilPeriod >= ovulationEnd) {
    return { phase: 'ovulation', dayOffset: ovulationStart - daysUntilPeriod + 1 };
  }

  // 卵泡期：经期结束后到排卵期前
  if (daysUntilPeriod > ovulationStart) {
    const dayOffset = daysUntilPeriod - avgPeriodDays;
    return { phase: 'follicular', dayOffset: Math.max(1, dayOffset) };
  }

  // 黄体期：排卵结束后到下次经期前
  const dayOffset = ovulationEnd - daysUntilPeriod;
  return { phase: 'luteal', dayOffset: Math.max(1, dayOffset) };
}
