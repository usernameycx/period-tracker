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
import { parseDate, addDays } from '../utils/date';

/** Single source of truth for the current phase, computed once per render cycle. */
export function useCurrentPhase(): CalendarPhaseInfo | null {
  const { records } = usePeriod();

  return useMemo(() => {
    if (records.length === 0) return null;

    const today = new Date();
    const fromCalendar = getPhaseForCalendarDay(today, records);
    if (fromCalendar) return fromCalendar;

    // If today is before the first recorded cycle, we can't predict backwards
    const sorted = [...records].sort((a, b) => a.start_date.localeCompare(b.start_date));
    const earliestStart = parseDate(sorted[0].start_date);
    if (today < earliestStart) return null;

    // Fallback: predictive model for dates after or within known cycles
    const nextStart = getNextPredictedStart(records);
    const avgDays = getAveragePeriodDays(records);
    const cycleLength = getAverageCycleLength(records) || DEFAULT_CYCLE_DAYS;
    if (nextStart) {
      const nextStartDate = parseDate(nextStart);
      // Don't predict beyond the one cycle we have data for
      if (today >= addDays(nextStartDate, avgDays)) return null;
      return getPhaseForDate(today, nextStartDate, avgDays, cycleLength);
    }

    return null;
  }, [records]);
}

/** Returns phase info for today, or null if no data covers it. */
export function useCurrentPhaseOrDefault(): CalendarPhaseInfo | null {
  return useCurrentPhase();
}
