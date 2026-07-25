/**
 * Period statistics helpers.
 *
 * A "cycle" is defined by consecutive pairs of period-start dates.
 * Cycle length = days between two consecutive start dates.
 * Period length = user-recorded end_date - start_date + 1, or
 *                 gap between consecutive start dates if no end_date.
 */

import { PeriodRecord } from '../db/period-records';

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
    // Single record: still report period days if end_date is set
    const periodLengths: number[] = [];
    if (records.length === 1 && records[0].end_date) {
      const len = diffDays(parseDate(records[0].end_date), parseDate(records[0].start_date)) + 1;
      if (len >= 1 && len <= 10) periodLengths.push(len);
    }
    return {
      avgCycleLength: null, avgPeriodDays: periodLengths.length > 0 ? periodLengths[0] : null,
      totalCycles: 0, cycleLengths: [], periodLengths,
      minCycleLength: null, maxCycleLength: null,
      minPeriodDays: periodLengths.length > 0 ? Math.min(...periodLengths) : null,
      maxPeriodDays: periodLengths.length > 0 ? Math.max(...periodLengths) : null,
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

  // Period lengths: prefer user-recorded end_date, fall back to gap estimation
  const periodLengths: number[] = [];
  for (let i = 0; i < unique.length; i++) {
    const r = unique[i];
    const start = parseDate(r.start_date);

    if (r.end_date) {
      // User explicitly set the end date — use it directly
      const len = diffDays(parseDate(r.end_date), start) + 1;
      if (len >= 1 && len <= 10) periodLengths.push(len);
      continue;
    }

    // No end_date — estimate from gap to next record, or skip
    if (i < unique.length - 1) {
      const nextStart = parseDate(unique[i + 1].start_date);
      const gap = Math.round((nextStart.getTime() - start.getTime()) / MS_PER_DAY);
      // Gap represents full cycle, but period is only the first part
      // Use a conservative estimate: if gap is 21-35 days, period is ~20% of gap
      if (gap >= 18 && gap <= 40) {
        const est = Math.max(3, Math.min(10, Math.round(gap * 0.2)));
        periodLengths.push(est);
      }
    }
    // Last record with no end_date: skip (can't estimate reliably)
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

function diffDays(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / MS_PER_DAY);
}
