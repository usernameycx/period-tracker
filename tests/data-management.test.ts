import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PeriodRecord } from '../src/db/period-records';
import { SymptomRecord } from '../src/constants/symptoms';
import {
  buildCycleOptions,
  buildSymptomDayOptions,
  countSymptomFields,
  formatFullDate,
  formatMonthDay,
  formatMonthDayWeek,
  formatYearMonth,
} from '../src/services/data-management';

function rec(id: number, start: string, end: string | null = null): PeriodRecord {
  return { id, start_date: start, end_date: end, created_at: '' };
}

function sym(date: string, fields: Partial<SymptomRecord> = {}): SymptomRecord {
  return {
    id: 0, date,
    flow: null, cramps: null, mood: null, energy: null,
    headache: 0, bloating: 0, cravings: 0, backPain: 0, breastPain: 0, skinSensitive: 0,
    notes: null, created_at: '',
    ...fields,
  };
}

test('formatMonthDay / formatMonthDayWeek / formatFullDate / formatYearMonth', () => {
  assert.equal(formatMonthDay('2026-11-19'), '11月19日');
  assert.equal(formatMonthDayWeek('2026-11-19'), '11月19日 周四');
  assert.equal(formatMonthDayWeek('2026-11-22'), '11月22日 周日');
  assert.equal(formatFullDate('2026-11-19'), '2026年11月19日');
  assert.equal(formatYearMonth('2026-11-19'), '2026年11月');
});

test('buildCycleOptions: 最近的周期排在最前', () => {
  const options = buildCycleOptions([
    rec(1, '2026-06-01', '2026-06-05'),
    rec(2, '2026-07-02', '2026-07-06'),
    rec(3, '2026-08-01'),
  ]);
  assert.deepEqual(options.map(o => o.id), [3, 2, 1]);
});

test('buildCycleOptions: 有结束日用实际经期天数（含首尾）', () => {
  const [opt] = buildCycleOptions([rec(1, '2026-07-02', '2026-07-06')]);
  assert.equal(opt.periodDays, 5);
  assert.equal(opt.ongoing, false);
  assert.equal(opt.label, '7月2日 ~ 7月6日');
  assert.equal(opt.subtitle, '2026年 · 经期 5 天');
  assert.equal(opt.section, '2026年');
});

test('buildCycleOptions: 未标记结束 → ongoing + 推算天数 + "起" 文案', () => {
  const [opt] = buildCycleOptions([rec(1, '2026-08-01')]);
  assert.equal(opt.ongoing, true);
  assert.equal(opt.periodDays, 5); // 默认 5 天
  assert.equal(opt.label, '8月1日 起');
  assert.equal(opt.subtitle, '2026年 · 进行中 · 推算 5 天');
});

test('buildCycleOptions: 可传入自定义推算天数', () => {
  const [opt] = buildCycleOptions([rec(1, '2026-08-01')], 7);
  assert.equal(opt.periodDays, 7);
});

test('buildCycleOptions: 跨年同月同日靠年份/分组区分', () => {
  const options = buildCycleOptions([
    rec(1, '2025-11-19', '2025-11-23'),
    rec(2, '2026-11-19', '2026-11-23'),
  ]);
  // 主标题相同，但副标题与分组不同 —— 列表里不会出现两个无法区分的"11月19日"
  assert.equal(options[0].label, options[1].label);
  assert.equal(options[0].subtitle, '2026年 · 经期 5 天');
  assert.equal(options[1].subtitle, '2025年 · 经期 5 天');
  assert.deepEqual(options.map(o => o.section), ['2026年', '2025年']);
});

test('buildCycleOptions: 空记录返回空数组', () => {
  assert.deepEqual(buildCycleOptions([]), []);
});

test('countSymptomFields: 文本项 + 开关项都计入', () => {
  assert.equal(countSymptomFields(sym('2026-11-19')), 0);
  assert.equal(
    countSymptomFields(sym('2026-11-19', { flow: 'medium', mood: 'calm', headache: 1 })),
    3
  );
  assert.equal(
    countSymptomFields(sym('2026-11-19', { cramps: null, notes: '有点累', backPain: 1, breastPain: 1 })),
    3
  );
});

test('buildSymptomDayOptions: 按日期倒序 + 副标题含年份 + 按月分组', () => {
  const options = buildSymptomDayOptions([
    sym('2026-11-17', { flow: 'light' }),
    sym('2026-11-19', { flow: 'medium', mood: 'calm' }),
    sym('2026-10-02', { flow: 'light' }),
  ]);
  assert.deepEqual(options.map(o => o.date), ['2026-11-19', '2026-11-17', '2026-10-02']);
  assert.equal(options[0].label, '11月19日 周四');
  assert.equal(options[0].subtitle, '2026年 · 2 项记录');
  assert.equal(options[0].section, '2026年11月');
  assert.equal(options[2].section, '2026年10月');
  assert.equal(options[1].subtitle, '2026年 · 1 项记录');
});

test('buildSymptomDayOptions: 空记录显示"空记录"', () => {
  const [opt] = buildSymptomDayOptions([sym('2026-11-19')]);
  assert.equal(opt.subtitle, '2026年 · 空记录');
});
