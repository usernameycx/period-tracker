## 这个 PR 做了什么

<!-- 一句话说清改了什么 -->

## 为什么改

<!-- 关联 Issue：Closes #123 -->

## 怎么验证的

- [ ] `npm test` 通过
- [ ] `npx tsc --noEmit` 通过
- [ ] 真机/模拟器上手动验证过（说明验证场景）

## 截图（UI 改动必填）

| 改动前 | 改动后 |
|--------|--------|
|        |        |

## 自查清单

- [ ] 没有提交任何 API key、`.env`、`local.properties`
- [ ] 没有提交构建产物（`android/app/build/`、`.expo/`）
- [ ] 如果改了周期预测算法，已同步 `DailyNotificationReceiver.kt` 的 Kotlin 实现
- [ ] 新增/修改的逻辑有对应测试
- [ ] 样式使用了 `theme.ts` 的 token（未硬编码色值/字号）
