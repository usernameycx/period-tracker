import { PeriodRecord } from '../db/period-records';
import { Phase, DEFAULT_PERIOD_DAYS, DEFAULT_CYCLE_DAYS, OVULATION_BEFORE_PERIOD, OVULATION_SPAN, MIN_RECORDS_FOR_PREDICTION } from '../constants/phases';
import { parseDate, diffDays, addDays, formatDate } from '../utils/date';

/** Minimum plausible cycle length — skip records closer than this when computing phases */
const MIN_CYCLE = 21;

/** Filter out records that are implausibly close together before phase computation.
 *  This keeps existing "bad" data from breaking the calendar display while
 *  the entry-point validation (PeriodContext.addRecord) prevents new bad data. */
function getValidCycleStarts(records: PeriodRecord[]): PeriodRecord[] {
  if (records.length <= 1) return records;
  const sorted = [...records].sort((a, b) => a.start_date.localeCompare(b.start_date));
  const valid: PeriodRecord[] = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const dist = diffDays(parseDate(sorted[i].start_date), parseDate(valid[valid.length - 1].start_date));
    if (dist >= MIN_CYCLE) {
      valid.push(sorted[i]);
    }
  }
  return valid;
}

export function getAveragePeriodDays(_records?: PeriodRecord[]): number {
  return DEFAULT_PERIOD_DAYS;
}

export function getAverageCycleLength(records: PeriodRecord[]): number | null {
  if (records.length < MIN_RECORDS_FOR_PREDICTION) return null;
  const valid = getValidCycleStarts(records);
  if (valid.length < MIN_RECORDS_FOR_PREDICTION) return null;
  const sorted = [...valid].sort((a, b) => a.start_date.localeCompare(b.start_date));
  const lengths: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const len = diffDays(parseDate(sorted[i].start_date), parseDate(sorted[i - 1].start_date));
    // Clamp to biologically plausible range
    if (len >= 21 && len <= 35) {
      lengths.push(len);
    }
  }
  if (lengths.length === 0) return null;

  // Simple average (not weighted — too unstable with sparse data)
  const avg = Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);
  // Blend toward 28 when data is sparse
  const blend = Math.min(1, lengths.length / 4);
  return Math.round(avg * blend + DEFAULT_CYCLE_DAYS * (1 - blend));
}

export function predictNextPeriod(records: PeriodRecord[]): Date | null {
  const valid = getValidCycleStarts(records);
  const sorted = [...valid].sort((a, b) => b.start_date.localeCompare(a.start_date));
  if (sorted.length === 0) return null;
  const lastStart = parseDate(sorted[0].start_date);
  const cycleLength = getAverageCycleLength(records) || DEFAULT_CYCLE_DAYS;
  return addDays(lastStart, cycleLength);
}

export function getNextPredictedStart(records: PeriodRecord[]): string | null {
  const d = predictNextPeriod(records);
  return d ? formatDate(d) : null;
}

export function getPhaseForDate(
  date: Date,
  predictedNextStart: Date,
  avgPeriodDays: number,
  cycleLength: number
): CalendarPhaseInfo {
  // Normalize date to midnight to avoid time-of-day skew in diffDays
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const nextDate = formatDate(predictedNextStart);

  // Derive current cycle start from predicted next start
  const currentCycleStart = addDays(predictedNextStart, -cycleLength);
  const daysFromStart = diffDays(d, currentCycleStart) + 1;
  const daysUntilNext = diffDays(predictedNextStart, d);

  // Period: current cycle days 1..avgPeriodDays
  if (daysFromStart >= 1 && daysFromStart <= avgPeriodDays) {
    return { phase: 'period', dayOffset: daysFromStart, daysUntilPeriod: daysUntilNext, nextPeriodDate: nextDate };
  }

  // Also catch dates at or after predictedNextStart (next cycle's period)
  if (daysUntilNext <= 0 && daysUntilNext > -avgPeriodDays) {
    return { phase: 'period', dayOffset: -daysUntilNext + 1, daysUntilPeriod: daysUntilNext, nextPeriodDate: nextDate };
  }

  // Ovulation window (counted backward from next period, same as calendar)
  const ovulationStart = OVULATION_BEFORE_PERIOD + Math.floor(OVULATION_SPAN / 2);
  const ovulationEnd = OVULATION_BEFORE_PERIOD - Math.floor(OVULATION_SPAN / 2);
  if (daysUntilNext <= ovulationStart && daysUntilNext >= ovulationEnd) {
    return { phase: 'ovulation', dayOffset: ovulationStart - daysUntilNext + 1, daysUntilPeriod: daysUntilNext, nextPeriodDate: nextDate };
  }

  // Follicular: after period, before ovulation — use daysFromStart like calendar
  if (daysUntilNext > ovulationStart) {
    const dayOffset = daysFromStart - avgPeriodDays;
    return { phase: 'follicular', dayOffset: Math.max(1, dayOffset), daysUntilPeriod: daysUntilNext, nextPeriodDate: nextDate };
  }

  // Luteal: after ovulation, before next period
  const dayOffset = ovulationEnd - daysUntilNext;
  return { phase: 'luteal', dayOffset: Math.max(1, dayOffset), daysUntilPeriod: daysUntilNext, nextPeriodDate: nextDate };
}

export interface CalendarPhaseInfo {
  phase: Phase;
  dayOffset: number;
  /** Days until the next period starts (0 = today is period day 1) */
  daysUntilPeriod: number;
  /** The date when the next period is expected (formatted YYYY-MM-DD) */
  nextPeriodDate: string;
}

/** Compute phase for a calendar day. Only colors dates within recorded cycles;
 *  dates before the first record or beyond the last predicted end → null. */
export function getPhaseForCalendarDay(
  date: Date,
  records: PeriodRecord[]
): CalendarPhaseInfo | null {
  if (records.length === 0) return null;

  // Normalize to midnight — input may carry current time (new Date()),
  // but cycleStart from parseDate is always midnight. Without normalization,
  // Math.round in diffDays skews the dayOffset by +1 in the afternoon.
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  // Use only valid cycle starts to avoid implausibly-short "cycles"
  const valid = getValidCycleStarts(records);
  const sorted = [...valid].sort((a, b) => a.start_date.localeCompare(b.start_date));
  const PERIOD_DAYS = DEFAULT_PERIOD_DAYS;

  // Find which cycle this date belongs to
  for (let i = 0; i < sorted.length; i++) {
    const cycleStart = parseDate(sorted[i].start_date);

    // Date is before this cycle → not in any cycle yet
    if (d < cycleStart) return null;

    // Determine cycle end (next recorded start, or predicted)
    let cycleEnd: Date;
    if (i + 1 < sorted.length) {
      cycleEnd = parseDate(sorted[i + 1].start_date);
    } else {
      // Last cycle: predict next period
      const predicted = predictNextPeriod(records);
      cycleEnd = predicted || addDays(cycleStart, DEFAULT_CYCLE_DAYS);
    }

    // Date is within this cycle?
    if (d < cycleEnd) {
      const daysFromStart = diffDays(d, cycleStart) + 1;
      const daysUntilEnd = diffDays(cycleEnd, d);
      const nextDate = formatDate(cycleEnd);

      // Period: days 1..PERIOD_DAYS
      if (daysFromStart >= 1 && daysFromStart <= PERIOD_DAYS) {
        return { phase: 'period', dayOffset: daysFromStart, daysUntilPeriod: daysUntilEnd, nextPeriodDate: nextDate };
      }

      // Ovulation window
      const ovStart = OVULATION_BEFORE_PERIOD + Math.floor(OVULATION_SPAN / 2);
      const ovEnd = OVULATION_BEFORE_PERIOD - Math.floor(OVULATION_SPAN / 2);
      if (daysUntilEnd <= ovStart && daysUntilEnd >= ovEnd) {
        return { phase: 'ovulation', dayOffset: ovStart - daysUntilEnd + 1, daysUntilPeriod: daysUntilEnd, nextPeriodDate: nextDate };
      }

      // Follicular
      if (daysUntilEnd > ovStart) {
        return { phase: 'follicular', dayOffset: Math.max(1, daysFromStart - PERIOD_DAYS), daysUntilPeriod: daysUntilEnd, nextPeriodDate: nextDate };
      }

      // Luteal
      return { phase: 'luteal', dayOffset: Math.max(1, ovEnd - daysUntilEnd), daysUntilPeriod: daysUntilEnd, nextPeriodDate: nextDate };
    }
  }

  // Date is beyond the last cycle end → no marking
  return null;
}
