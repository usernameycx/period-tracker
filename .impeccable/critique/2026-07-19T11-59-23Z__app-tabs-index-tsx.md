---
target: app/(tabs)/index.tsx
total_score: 25
p0_count: 2
p1_count: 2
timestamp: 2026-07-19T11-59-23Z
slug: app-tabs-index-tsx
---
# FayeTide Design Critique — Re-evaluation

**Target:** `app/(tabs)/index.tsx` (Today page + all components)
**Date:** 2026-07-19
**Method:** dual-agent (A: design director · B: detector + manual scan)

---

## Design Health Score: 25/40 — Acceptable

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3/4 | 缺少骨架屏加载、天气无"上次更新"时间戳 |
| 2 | Match Between System and Real World | 3/4 | 中文文案好，但 Phase 术语无解释 |
| 3 | User Control and Freedom | 3/4 | 缺下滑关闭、无撤销操作 |
| 4 | Consistency and Standards | 2/4 | 74 处硬编码值绕过 token 体系 |
| 5 | Error Prevention | 3/4 | 可标记未来日期、症状静默保存无撤销 |
| 6 | Recognition Rather Than Recall | 3/4 | 症状记录藏在 DayDetailSheet 深层 |
| 7 | Flexibility and Efficiency of Use | 2/4 | 标记经期需 3-4 步、日历无滑动手势 |
| 8 | Aesthetic and Minimalist Design | 3/4 | 12 处 WCAG AA 对比度不达标 |
| 9 | Error Recovery | 2/4 | 错误提示通用但无恢复指引 |
| 10 | Help and Documentation | 1/4 | 仅 3 步引导 + 免责声明 |

---

## Anti-Patterns Verdict

### LLM Assessment
**三个 AI 信号：**
1. 粉色单一文化 — 设计文档说 pink accent only，代码中 ~40% 表面是粉色
2. Emoji + Icon 双系统 — 26 个 SVG icon 与 ~140 条 emoji 数据并存
3. 统一白色卡片墙 — sharedCard.base 被不加区分地重复使用

**人工打磨亮点：** LunarCard 黄历体系、暖心地道的文案、差异化冷启动引导

### Detector Scan
- CLI detector: 0 findings（不识别 React Native StyleSheet）
- 手动扫描: 29 硬编码色值 + 20 硬编码字号 + 36 硬编码间距 + 9 硬编码圆角
- 9 处 JSX emoji + ~140 条数据文件 emoji
- **12 处 WCAG AA 对比度不达标**

---

## Priority Issues

### P0 — Emoji + Icon 双系统
PHASE_EMOJI 和 PHASE_ICONS 并存。9 处 JSX emoji + ~140 条数据 emoji。移除 PHASE_EMOJI，数据 emoji 迁移为 Icon name。
→ `/impeccable polish`

### P0 — 首次启动双模态弹窗
OnboardingModal + CityOnboardingModal 连续弹出。合并为单一引导流程。
→ `/impeccable onboard`

### P1 — 12 处 WCAG AA 对比度不达标
日历日数字在 Phase 背景色上最低 ~2.5:1（要求 ≥4.5:1）。粉色文字在粉色背景上 ~2.3:1。
→ `/impeccable audit`

### P1 — 无快速标记经期入口
最频繁操作需 3-4 步。在 CycleStatusCard 加入快捷按钮。
→ `/impeccable craft`

### P2 — 74 处硬编码值绕过 Design Token
CityOnboardingModal.tsx 完全未 token 化。全量审计 #/rgba → Colors。
→ `/impeccable polish`

---

## Persona Red Flags

**Jordan（新用户）：** Phase 术语无解释、症状问卷与标记混在一起让人困惑、全 App 无 tooltip
**Casey（单手使用）：** 日历导航 tap target ~20×28px（要求 ≥44dp）、无滑动手势、症状静默保存无反馈
**Riley（测试者）：** 可标记 2099 年日期、CityPicker 无 maxLength、DailyQuoteCard 加载时返回 null 导致布局跳动
