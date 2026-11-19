import { PeriodRecord } from '../db/period-records';
import { SymptomRecord } from '../constants/symptoms';
import { DEFAULT_PERIOD_DAYS } from '../constants/phases';
import { parseDate, diffDays } from '../utils/date';

/** "2026-11-19" → "11月19日" */
export function formatMonthDay(iso: string): string {
  const d = parseDate(iso);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

/** "2026-11-19" → "2026年11月19日" */
export function formatFullDate(iso: string): string {
  const d = parseDate(iso);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

/** "2026-11-19" → "11月19日 周四" */
export function formatMonthDayWeek(iso: string): string {
  const d = parseDate(iso);
  const w = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
  return `${formatMonthDay(iso)} 周${w}`;
}

/** "2026-11-19" → "2026年11月"（列表分组标题） */
export function formatYearMonth(iso: string): string {
  const d = parseDate(iso);
  return `${d.getFullYear()}年${d.getMonth() + 1}月`;
}

export interface CycleOption {
  id: number;
  startDate: string;
  endDate: string | null;
  /** 是否还没标记结束日 */
  ongoing: boolean;
  /** 经期天数：有结束日按实际天数，否则按推算天数 */
  periodDays: number;
  /** 主标题，例：11月19日 ~ 11月23日 */
  label: string;
  /** 副标题（含年份，避免跨年同月同日混淆），例：2026年 · 经期 5 天 */
  subtitle: string;
  /** 分组标题，例：2026年 */
  section: string;
}

/**
 * 把经期记录整理成"按周期删除"的选项列表（最近的在最前）。
 * 纯函数，便于单测；不依赖数据库与 UI。
 */
export function buildCycleOptions(
  records: PeriodRecord[],
  fallbackPeriodDays: number = DEFAULT_PERIOD_DAYS
): CycleOption[] {
  return [...records]
    .sort((a, b) => b.start_date.localeCompare(a.start_date))
    .map(r => {
      const ongoing = !r.end_date;
      const periodDays = r.end_date
        ? Math.max(1, diffDays(parseDate(r.end_date), parseDate(r.start_date)) + 1)
        : fallbackPeriodDays;
      const year = parseDate(r.start_date).getFullYear();
      const label = ongoing
        ? `${formatMonthDay(r.start_date)} 起`
        : `${formatMonthDay(r.start_date)} ~ ${formatMonthDay(r.end_date!)}`;
      // 年份放在副标题：主标题保持短，年份始终可见（跨年不会出现两个"11月19日"）
      const subtitle = ongoing
        ? `${year}年 · 进行中 · 推算 ${periodDays} 天`
        : `${year}年 · 经期 ${periodDays} 天`;
      return {
        id: r.id,
        startDate: r.start_date,
        endDate: r.end_date,
        ongoing,
        periodDays,
        label,
        subtitle,
        section: `${year}年`,
      };
    });
}

export interface SymptomDayOption {
  date: string;
  /** 主标题，例：11月19日 周四 */
  label: string;
  /** 副标题（含年份），例：2026年 · 4 项记录 */
  subtitle: string;
  /** 分组标题，例：2026年11月 */
  section: string;
}

/** 统计一条症状记录里有内容的字段数量（用于列表副标题） */
export function countSymptomFields(record: SymptomRecord): number {
  const textFields = [record.flow, record.cramps, record.mood, record.energy, record.notes];
  const flagFields = [
    record.headache, record.bloating, record.cravings,
    record.backPain, record.breastPain, record.skinSensitive,
  ];
  const textCount = textFields.filter(v => !!v).length;
  const flagCount = flagFields.filter(v => !!v && v !== 0).length;
  return textCount + flagCount;
}

/**
 * 把症状记录整理成"按天删除"的选项列表（最近的日期在最前，按月分组）。
 */
export function buildSymptomDayOptions(rows: SymptomRecord[]): SymptomDayOption[] {
  return [...rows]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(r => {
      const count = countSymptomFields(r);
      return {
        date: r.date,
        label: formatMonthDayWeek(r.date),
        subtitle: `${parseDate(r.date).getFullYear()}年 · ${count > 0 ? `${count} 项记录` : '空记录'}`,
        section: formatYearMonth(r.date),
      };
    });
}
