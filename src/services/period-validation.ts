import { PeriodRecord } from '../db/period-records';
import { parseDate, diffDays } from '../utils/date';

/** Minimum plausible cycle length — prevents accidental multi-marking within one month */
export const MIN_CYCLE_DAYS = 21;

/**
 * 找新日期之前、最近一个"缺少结束日期"的周期（从近到远）。
 * 只要存在未设置结束日期的历史周期，录入新周期前都应提醒补齐，
 * 保证"已结束的周期不受后续操作修改"（缺 end_date 的周期会随全局平均漂移）。
 */
export function findPrevMissingEndRecord(records: PeriodRecord[], date: Date): PeriodRecord | null {
  const sorted = [...records].sort((a, b) => a.start_date.localeCompare(b.start_date));
  for (let i = sorted.length - 1; i >= 0; i--) {
    const rec = sorted[i];
    if (parseDate(rec.start_date) < date && !rec.end_date) return rec;
  }
  return null;
}

/** 两次经期的最短合理间隔校验；不满足时抛出可读错误。 */
export function assertMinCycleDistance(records: PeriodRecord[], newDate: Date): void {
  for (const rec of records) {
    const dist = Math.abs(diffDays(parseDate(rec.start_date), newDate));
    if (dist > 0 && dist < MIN_CYCLE_DAYS) {
      throw new Error(
        `两次经期间隔太近（仅${dist}天），一般至少需要${MIN_CYCLE_DAYS}天。是不是点错了日期？`
      );
    }
  }
}
