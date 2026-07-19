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

  const cycles: { start: string; length: number }[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const len = diffDays(parseDate(sorted[i].start_date), parseDate(sorted[i - 1].start_date));
    if (len >= 21 && len <= 35) {
      cycles.push({ start: sorted[i - 1].start_date, length: len });
    }
  }

  const totalCycles = cycles.length;

  if (totalCycles === 0) {
    return { totalCycles: 0, avgCycleLength: null, minCycleLength: null, maxCycleLength: null, regularity: null, regularityLabel: '暂无数据', cycles: [] };
  }

  const lengths = cycles.map(c => c.length);
  const avgCycleLength = Math.round(lengths.reduce((a, b) => a + b, 0) / totalCycles);
  const minCycleLength = Math.min(...lengths);
  const maxCycleLength = Math.max(...lengths);

  // Regularity: based on range (max - min)
  const range = maxCycleLength - minCycleLength;
  let regularity: CycleStats['regularity'];
  let regularityLabel: string;
  if (range <= 2) {
    regularity = 'regular';
    regularityLabel = '非常规律';
  } else if (range <= 5) {
    regularity = 'slightly_irregular';
    regularityLabel = '基本规律';
  } else {
    regularity = 'irregular';
    regularityLabel = '不太规律';
  }

  return { totalCycles, avgCycleLength, minCycleLength, maxCycleLength, regularity, regularityLabel, cycles };
}
