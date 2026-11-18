# 贡献指南

谢谢你愿意参与。这个项目不大，流程也尽量简单：**开 Issue 说明问题 → 提 PR → CI 绿了就能合**。

## 开始之前

```bash
npm install
cp .env.example .env           # 填入你的高德 Web 服务 key
npm run android                # 或 npm start（无原生模块，定位会降级）
```

完整环境要求见 [README · 快速开始](README.md#快速开始)。

## 分支与提交

- 从 `main` 切分支：`feat/xxx`、`fix/xxx`、`docs/xxx`
- 提交信息用 Conventional Commits，描述用中文或英文都行：

```
feat: 日历支持左右滑动切换月份
fix: 修复切换城市后天气错位
docs: 补充数据库 schema 说明
test: 补排卵边界的单元测试
chore: 升级 expo 到 57.0.7
```

一次提交只做一件事，别把格式化改动和逻辑改动混在一起。

## 代码约定

- **TypeScript strict**，不要 `any` 逃逸（确实必要时加注释说明）
- **样式只用 `src/constants/theme.ts` 里的 token**，不要写裸色值/裸字号（阶段色例外，见 `phases.ts`）
- **图标加到 `src/components/Icon.tsx`**，用 SVG path，不要引第三方图标库
- **中文文案直接写中文字符串**，暂不做 i18n（未来会引入，届时统一抽取）
- **数据库改动**必须写迁移（`CREATE TABLE IF NOT EXISTS` 之外的 ALTER 需兼容老库）

## 改周期算法的特别注意

预测算法在 **JS 和 Kotlin 里各有一份实现**：

- `src/services/prediction.ts`
- `android/app/src/main/java/com/periodtracker/app/DailyNotificationReceiver.kt`（`calculatePhase`）

改一处必须同步另一处，否则 App 内显示和每日通知会打架。改完请补/跑 `tests/prediction.test.ts`。

## 测试

```bash
npm test            # 单元测试
npm run typecheck    # 类型检查（CI 也会跑）
```

逻辑改动请补测试，UI 改动请在 PR 里贴一张截图/录屏。

## 提 PR 前

- [ ] `npm test` 与 `npm run typecheck` 通过
- [ ] 没有提交任何 key / 个人信息（`.env`、`local.properties` 不在 diff 里）
- [ ] 没有提交构建产物（`android/app/build/`、`.expo/`）
- [ ] PR 描述里说明「为什么改」而不只是「改了什么」
- [ ] 如果是 UI 改动，附前后对比截图

## 不要做的事

- 不要提交高德 key、签名文件、`.env`、`local.properties`
- 不要引入需要云服务的功能（本项目坚持本地优先）
- 不要为了「好看」重构无关文件，PR 越小越好审
- 不要提交 `node_modules`、`android/app/build`、截图原图（截图请放 `docs/screenshots/`）

## 报告 Bug

用 [Bug 模板](https://github.com/usernameycx/period-tracker/issues/new?template=bug_report.yml)，请附：

- App 版本（设置页底部）与 Android 版本
- 复现步骤
- 期望结果 / 实际结果
- 相关截图或 logcat 片段

## 行为准则

友善、就事论事。涉及他人身体与健康的话题请保持尊重，不接受任何歧视性表述。
