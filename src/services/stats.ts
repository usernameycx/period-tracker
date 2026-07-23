/**
 * Period statistics helpers.
 *
 * A "cycle" is defined by consecutive pairs of period-start dates.
 * Cycle length = days between two consecutive start dates.
 * Period length = days from start_date to the day before the next start_date
 *                 >= the recorded start_date and in the same period block.
 *
 * Period days counting rule:
 * We trace forward from a recorded start_date. Each day is counted as a
 * period day until we encounter another start_date that opens a NEW
 * period (the start of the next cycle). We do NOT count days after that
 * new start as belonging to the previous period.
 */
import { PeriodRecord } from '../db/period-records';
import { DEFAULT_PERIOD_DAYS } from '../constants/phases';

export interface PeriodStats {
  avgCycleLength: number | null;
  avgPeriodDays: number | null;
  totalCycles: number;
  cycleLengths: number[];
  periodLengths: number[];
  minCycleLength: number | null;
  maxCycleLength: number | null;
  minPeriodDays: number | null;
  maxPeriodDays: number | null;
  regularity: 'regular' | 'slightly_irregular' | 'irregular' | 'unknown';
}

const REGULARITY_THRESHOLD = 3; // ± days

export function computeStats(records: PeriodRecord[]): PeriodStats {
  if (records.length < 2) {
    return {
      avgCycleLength: null, avgPeriodDays: null,
      totalCycles: 0, cycleLengths: [], periodLengths: [],
      minCycleLength: null, maxCycleLength: null,
      minPeriodDays: null, maxPeriodDays: null,
      regularity: 'unknown',
    };
  }

  // Sort ascending by date
  const sorted = [...records].sort((a, b) =>
    a.start_date.localeCompare(b.start_date),
  );

  // Deduplicate by date (keep first)
  const seen = new Set<string>();
  const unique = sorted.filter(r => {
    if (seen.has(r.start_date)) return false;
    seen.add(r.start_date);
    return true;
  });

  // Cycle lengths: days between consecutive start dates
  const cycleLengths: number[] = [];
  for (let i = 1; i < unique.length; i++) {
    const prev = parseDate(unique[i - 1].start_date);
    const curr = parseDate(unique[i].start_date);
    const diff = Math.round((curr.getTime() - prev.getTime()) / MS_PER_DAY);
    if (diff > 0) cycleLengths.push(diff);
  }

  // Build date set for O(1) lookup
  const dateSet = new Set(unique.map(r => r.start_date));

  // Period lengths: for each start_date, count consecutive days that belong
  // to this period before the NEXT start_date appears.
  const periodLengths: number[] = [];
  for (let i = 0; i < unique.length; i++) {
    const start = parseDate(unique[i].start_date);
    const nextStart = i < unique.length - 1
      ? parseDate(unique[i + 1].start_date)
      : undefined;

    // Walk forward day by day until we hit another recorded start
    let days = 0;
    const cursor = new Date(start);
    while (true) {
      const cursorStr = formatDate(cursor);
      // Check if this day is a start_date of a DIFFERENT record (O(1) lookup)
      if (cursorStr !== unique[i].start_date && dateSet.has(cursorStr)) break;

      // If we reached the next known start and it's not the same record,
      // that ends this period
      if (nextStart && cursorStr === unique[i + 1].start_date) break;

      days++;
      cursor.setDate(cursor.getDate() + 1);

      // Safety: max period length is ~14 days
      if (days > 14) break;
    }

    // Last record with no next start: use default period length
    if (!nextStart && days > 14) {
      days = DEFAULT_PERIOD_DAYS;
    }

    // Sanity: period should be >= 1 and <= 10 days
    if (days >= 1 && days <= 10) {
      periodLengths.push(days);
    }
  }

  // For regularity, compare each cycle length to the average
  let regularity: PeriodStats['regularity'] = 'unknown';
  if (cycleLengths.length >= 2) {
    const avg = cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length;
    const maxDev = Math.max(...cycleLengths.map(c => Math.abs(c - avg)));
    if (maxDev <= REGULARITY_THRESHOLD) {
      regularity = 'regular';
    } else if (maxDev <= REGULARITY_THRESHOLD * 2) {
      regularity = 'slightly_irregular';
    } else {
      regularity = 'irregular';
    }
  }

  return {
    avgCycleLength: cycleLengths.length > 0
      ? Math.round((cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length) * 10) / 10
      : null,
    avgPeriodDays: periodLengths.length > 0
      ? Math.round((periodLengths.reduce((a, b) => a + b, 0) / periodLengths.length) * 10) / 10
      : null,
    totalCycles: cycleLengths.length,
    cycleLengths,
    periodLengths,
    minCycleLength: cycleLengths.length > 0 ? Math.min(...cycleLengths) : null,
    maxCycleLength: cycleLengths.length > 0 ? Math.max(...cycleLengths) : null,
    minPeriodDays: periodLengths.length > 0 ? Math.min(...periodLengths) : null,
    maxPeriodDays: periodLengths.length > 0 ? Math.max(...periodLengths) : null,
    regularity,
  };
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function parseDate(d: string): Date {
  const [y, m, day] = d.split('-').map(Number);
  return new Date(y, m - 1, day);
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
