import { useMemo } from 'react';
import { usePeriod } from '../context/PeriodContext';
import {
  getNextPredictedStart,
  getAveragePeriodDays,
  getAverageCycleLength,
  getPhaseForCalendarDay,
  getPhaseForDate,
  CalendarPhaseInfo,
} from '../services/prediction';
import { DEFAULT_CYCLE_DAYS } from '../constants/phases';
import { parseDate } from '../utils/date';

/** Single source of truth for the current phase, computed once per render cycle. */
export function useCurrentPhase(): CalendarPhaseInfo | null {
  const { records } = usePeriod();

  return useMemo(() => {
    if (records.length === 0) return null;

    const today = new Date();
    const fromCalendar = getPhaseForCalendarDay(today, records);
    if (fromCalendar) return fromCalendar;

    // Fallback: predictive model
    const nextStart = getNextPredictedStart(records);
    const avgDays = getAveragePeriodDays(records);
    const cycleLength = getAverageCycleLength(records) || DEFAULT_CYCLE_DAYS;
    if (nextStart) {
      return getPhaseForDate(today, parseDate(nextStart), avgDays, cycleLength);
    }

    return null;
  }, [records]);
}

const defaultPhase: CalendarPhaseInfo = {
  phase: 'follicular',
  dayOffset: 1,
  daysUntilPeriod: 28,
  nextPeriodDate: '',
};

/** Like useCurrentPhase, but always returns a value (never null). */
export function useCurrentPhaseOrDefault(): CalendarPhaseInfo {
  return useCurrentPhase() ?? defaultPhase;
}
