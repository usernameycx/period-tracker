import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PeriodRecord } from '../src/db/period-records';
import {
  getAveragePeriodDays,
  getPhaseForCalendarDay,
  predictNextPeriod,
} from '../src/services/prediction';
import { formatDate } from '../src/utils/date';

function rec(start: string, end: string | null = null): PeriodRecord {
  return { id: 0, start_date: start, end_date: end, created_at: '' };
}

/**
 * 需求 7 复现场景：7/2 记录第一天（无结束日期）→ 忽略提醒按默认 5 天补齐 end=7/6
 * → 8/2 记录新周期。验证：平均经期天数为 5（修复前会因 31 天间隔估算成 6），
 * 已结束周期 7/2-7/6 稳定 5 天，不被新记录改写。
 */
const recordsAfterIgnore = [
  rec('2026-07-02', '2026-07-06'), // 忽略提醒后自动补齐的结束日期
  rec('2026-08-02'),               // 新周期，尚未结束
];

test('修复后平均经期天数 = 5（不随 31 天间隔漂移成 6）', () => {
  assert.equal(getAveragePeriodDays(recordsAfterIgnore), 5);
});

test('已结束周期 7/2-7/6 稳定为经期 5 天，7/7 进入卵泡期', () => {
  for (let d = 2; d <= 6; d++) {
    const info = getPhaseForCalendarDay(new Date(2026, 6, d), recordsAfterIgnore);
    assert.equal(info?.phase, 'period');
    assert.equal(info?.dayOffset, d - 1);
  }
  const after = getPhaseForCalendarDay(new Date(2026, 6, 7), recordsAfterIgnore);
  assert.equal(after?.phase, 'follicular');
});

test('新周期 8/2 起 5 天经期，8/7 进入卵泡期', () => {
  for (let d = 2; d <= 6; d++) {
    const info = getPhaseForCalendarDay(new Date(2026, 7, d), recordsAfterIgnore);
    assert.equal(info?.phase, 'period');
  }
  const after = getPhaseForCalendarDay(new Date(2026, 7, 7), recordsAfterIgnore);
  assert.equal(after?.phase, 'follicular');
});

test('预测下次经期 = 最后记录 + 混合后周期长度（稀疏数据向 28 天混合）', () => {
  // 间隔 31 天，仅 1 个数据点 → blend=0.25 → 31*0.25+28*0.75=29 → 8/2+29=8/31
  const next = predictNextPeriod(recordsAfterIgnore);
  assert.equal(formatDate(next!), '2026-08-31');
});

test('单条记录无结束日期时平均经期天数 = 默认 5', () => {
  assert.equal(getAveragePeriodDays([rec('2026-07-02')]), 5);
});
