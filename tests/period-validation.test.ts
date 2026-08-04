import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PeriodRecord } from '../src/db/period-records';
import { findPrevMissingEndRecord, assertMinCycleDistance, MIN_CYCLE_DAYS } from '../src/services/period-validation';

function rec(start: string, end: string | null = null): PeriodRecord {
  return { id: 0, start_date: start, end_date: end, created_at: '' };
}

const D = (s: string) => new Date(s);

test('findPrevMissingEndRecord: 最近周期缺结束日期 → 返回它', () => {
  const records = [rec('2026-07-02'), rec('2026-06-01', '2026-06-05')];
  const hit = findPrevMissingEndRecord(records, D('2026-08-02'));
  assert.equal(hit?.start_date, '2026-07-02');
});

test('findPrevMissingEndRecord: 最近周期有结束日期、更早的缺 → 返回更早那个', () => {
  const records = [rec('2026-07-02', '2026-07-06'), rec('2026-06-01')];
  const hit = findPrevMissingEndRecord(records, D('2026-08-02'));
  assert.equal(hit?.start_date, '2026-06-01');
});

test('findPrevMissingEndRecord: 全部有结束日期 → null', () => {
  const records = [rec('2026-07-02', '2026-07-06'), rec('2026-06-01', '2026-06-05')];
  assert.equal(findPrevMissingEndRecord(records, D('2026-08-02')), null);
});

test('findPrevMissingEndRecord: 只找新日期之前的周期', () => {
  // 新日期之后有一条缺结束日期的记录（未来记录），不应被算作"上一个周期"
  const records = [rec('2026-09-01')];
  assert.equal(findPrevMissingEndRecord(records, D('2026-08-02')), null);
});

test('assertMinCycleDistance: 间隔过近(18天) → 抛错', () => {
  const records = [rec('2026-07-02', '2026-07-06')];
  assert.throws(
    () => assertMinCycleDistance(records, D('2026-07-20')),
    /两次经期间隔太近/
  );
});

test('assertMinCycleDistance: 间隔等于 MIN_CYCLE_DAYS 不抛错', () => {
  const records = [rec('2026-07-02', '2026-07-06')];
  const d = new Date('2026-07-02');
  d.setDate(d.getDate() + MIN_CYCLE_DAYS);
  assert.doesNotThrow(() => assertMinCycleDistance(records, d));
});

test('assertMinCycleDistance: 同一天(重复标记)不抛错', () => {
  const records = [rec('2026-07-02', '2026-07-06')];
  assert.doesNotThrow(() => assertMinCycleDistance(records, D('2026-07-02')));
});

test('assertMinCycleDistance: 空记录不抛错', () => {
  assert.doesNotThrow(() => assertMinCycleDistance([], D('2026-07-02')));
});
