import { PeriodRecord } from '../db/period-records';
import { parseDate, diffDays } from '../utils/date';

export interface CycleStats {
  totalCycles: number;
  avgCycleLength: number | null;
  minCycleLength: number | null;
  maxCycleLength: number | null;
  regularity: 'regular' | 'slightly_irregular' | 'irregular' | null;
  regularityLabel: string;
  cycles: { start: string; length: number }[];
}

export function computeCycleStats(records: PeriodRecord[]): CycleStats {
  const sorted = [...records].sort((a, b) => a.start_date.localeCompare(b.start_date));

  const intervals: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    intervals.push(diffDays(parseDate(sorted[i].start_date), parseDate(sorted[i - 1].start_date)));
  }

  const totalCycles = intervals.length;

  if (totalCycles === 0) {
    return { totalCycles: 0, avgCycleLength: null, minCycleLength: null, maxCycleLength: null, regularity: null, regularityLabel: '暂无数据', cycles: [] };
  }

  const minCycleLength = Math.min(...intervals);
  const maxCycleLength = Math.max(...intervals);

  // Average: use only biologically plausible intervals (21-35 days)
  const valid = intervals.filter(n => n >= 21 && n <= 35);
  const avgSource = valid.length > 0 ? valid : intervals;
  const avgCycleLength = Math.round(avgSource.reduce((a, b) => a + b, 0) / avgSource.length);

  // Regularity: need ≥2 intervals, use only valid ones
  let regularity: CycleStats['regularity'] = null;
  let regularityLabel = '';
  if (valid.length >= 2) {
    const range = Math.max(...valid) - Math.min(...valid);
    if (range <= 2) { regularity = 'regular'; regularityLabel = '非常规律'; }
    else if (range <= 5) { regularity = 'slightly_irregular'; regularityLabel = '基本规律'; }
    else { regularity = 'irregular'; regularityLabel = '不太规律'; }
  } else if (totalCycles >= 1) {
    regularityLabel = '需要更多数据';
  } else {
    regularityLabel = '暂无数据';
  }

  return { totalCycles, avgCycleLength, minCycleLength, maxCycleLength, regularity, regularityLabel, cycles: [] };
}
