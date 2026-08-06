import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Phase } from '../src/constants/phases';
import { getLifeAdvice } from '../src/services/advice';

const weather = { temperature: 20, weatherCode: 1, condition: '晴', advice: '天气不错' };
const phases: Phase[] = ['period', 'follicular', 'ovulation', 'luteal'];

test('每个阶段建议池至少 5 条（30 天采样应覆盖 ≥4 条不同建议）', () => {
  const seen = new Map<Phase, Set<string>>();
  for (const p of phases) seen.set(p, new Set());
  for (let d = 1; d <= 30; d++) {
    const day = new Date(2026, 0, d);
    for (const p of phases) {
      const r = getLifeAdvice(p, weather, day);
      seen.get(p)!.add(r.phaseAdvice);
    }
  }
  for (const p of phases) {
    // 30 天从 5 条池中均匀采样，未覆盖 ≥4 条的概率极低（<0.01%）
    assert.ok(seen.get(p)!.size >= 4, `阶段 ${p} 只采样到 ${seen.get(p)!.size} 条，池可能不足 5 条`);
  }
});

test('同一天同一阶段返回同一条（seed 稳定，避免闪烁）', () => {
  const a = getLifeAdvice('period', weather);
  const b = getLifeAdvice('period', weather);
  assert.equal(a.phaseAdvice, b.phaseAdvice);
  assert.equal(a.weatherAdvice, '天气不错');
});

test('建议不含时间依赖词汇（第X天/今天/明天/本周）', () => {
  const timeWords = /第\s*\d+\s*天|今天|明天|昨天|本周|下周|昨日|今日/;
  for (let d = 1; d <= 30; d++) {
    for (const p of phases) {
      const r = getLifeAdvice(p, weather);
      assert.ok(!timeWords.test(r.phaseAdvice), `含时间词: "${r.phaseAdvice}" (${p})`);
    }
  }
});

test('建议每条 ≤20 字', () => {
  for (let d = 1; d <= 30; d++) {
    for (const p of phases) {
      const r = getLifeAdvice(p, weather);
      assert.ok(r.phaseAdvice.length <= 20, `超长: "${r.phaseAdvice}" ${r.phaseAdvice.length}字 (${p})`);
    }
  }
});

test('建议非空且不是废话（长度 > 4 字）', () => {
  for (const p of phases) {
    const r = getLifeAdvice(p, weather);
    assert.ok(r.phaseAdvice.length > 4, `过短: "${r.phaseAdvice}"`);
  }
});
