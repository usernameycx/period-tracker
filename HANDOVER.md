# FayeTide 项目交接文档

> 经期追踪 App · Expo SDK 57 · 2026年7月

---

## 1. 项目概览

**FayeTide** 是一款基于 React Native (Expo) 的经期追踪应用，面向中文女性用户。支持经期记录、周期预测、症状日志、农历日历、天气感知生活建议。

| 项 | 值 |
|---|-----|
| 仓库 | https://github.com/usernameycx/period-tracker |
| 分支 | `feature/initial-app` |
| EAS 项目 | `@y-y/period-tracker` |
| App 名称 | FayeTide |
| 包名 | `com.periodtracker.app` |

---

## 2. 环境搭建

### 前置条件
- Node.js ≥ 20
- npm ≥ 10
- Android Studio (用于本地调试)
- Expo 账号 (用于 EAS 云构建)

### 克隆并安装

```bash
git clone https://github.com/usernameycx/period-tracker.git
cd period-tracker
git checkout feature/initial-app
npm install
```

### 本地构建 APK

```bash
# arm64-v8a (覆盖绝大多数真机)
cd android
GRADLE_BIN="$HOME/.gradle/wrapper/dists/gradle-9.3.1-bin/8t615y5yb9wd0ztz5bhxung2w/gradle-9.3.1/bin/gradle"
"$GRADLE_BIN" assembleRelease -PreactNativeArchitectures=arm64-v8a
# APK 输出: android/app/build/outputs/apk/release/app-release.apk

# x86_64 (MuMu 模拟器)
"$GRADLE_BIN" assembleRelease -PreactNativeArchitectures=x86_64
```

**注意：** 如果 CMake 报 `260 char path limit`，使用短路径：
```bash
cmd //c "subst X: C:\path\to\project"
cd X:/android
"$GRADLE_BIN" assembleRelease -PreactNativeArchitectures=arm64-v8a
```

### 本地热更新调试
```bash
npx expo start
adb connect 127.0.0.1:7555      # MuMu
adb -s emulator-5554 reverse tcp:8081 tcp:8081
# 模拟器打开已安装的 debug APK，摇一摇 → Reload
```

---

## 3. 项目结构速查

```
app/                    # 页面 (expo-router 文件路由)
  _layout.tsx           # 全局 providers + 启动屏控制
  (tabs)/
    index.tsx           # 首页 (今日概览)
    calendar.tsx        # 日历页
    settings.tsx        # 设置页

src/
  components/           # UI 组件
  context/              # React Context (Period, Weather, Settings, SelectedDate)
  hooks/                # 自定义 hooks
  services/             # 业务逻辑 (预测、农历、天气、通知、统计)
  db/                   # SQLite 数据库操作
  constants/            # 主题、阶段、症状常量
  utils/                # 日期、备份工具

android/                # Android 原生项目 (已提交)
  app/src/main/java/com/periodtracker/app/
    DailyAlarmModule.kt           # JS↔原生闹钟桥接
    DailyNotificationReceiver.kt  # 原生闹钟接收器（读DB+天气+通知）
scripts/
  generate-icons.js     # 图标生成脚本 (需要 sharp)
plugins/                # Expo config plugins (原生注入)
assets/                 # 图片资源
```

### 核心文件

| 文件 | 作用 |
|------|------|
| `src/services/prediction.ts` | 周期预测算法（阶段划分、平均天数） |
| `src/hooks/useCurrentPhase.ts` | 当前阶段计算 |
| `src/components/Icon.tsx` | 所有 SVG 图标定义 |
| `src/components/SymptomPicker.tsx` | 症状选择 + 图标映射 |
| `src/constants/theme.ts` | 色彩、间距、排版系统 |
| `src/constants/phases.ts` | 阶段常量、默认天数、颜色 |
| `src/db/database.ts` | SQLite 初始化（含 period_records end_date） |
| `src/services/notifications.ts` | 通知调度 |
| `src/services/stats.ts` | 统计（用 end_date 算实际天数） |
| `android/app/src/main/res/drawable/splash_bg.xml` | 启动屏配置 |
| `eas.json` | EAS 构建配置 |

---

## 4. 关键架构决策

### 4.1 原生项目已提交到 Git

`android/` 目录不在 `.gitignore` 中。原因是需要自定义原生启动屏（`splash_bg.xml`）。这意味着：

- **app.json 不能有 `splash` 配置** — 启动屏配置在原生 XML 中
- **EAS 构建使用提交的 native 文件** — 不会重新 `expo prebuild`
- **修改原生配置后需要重新提交 + 重新构建**

### 4.2 启动屏

```
原生层: Theme.App.SplashScreen → splash_bg.xml (暖米色 #F8F2EA + 居中 logo)
```
不再有 JS 层遮罩。Native 启动屏展示 2-3 秒后自然过渡到 App。

### 4.3 周期预测算法

**科学默认值（28天标准周期）：**

| 阶段 | 天数 | 周期日 |
|------|------|--------|
| 经期 | 5天 | Day 1-5 |
| 卵泡期 | 8天 | Day 6-13 |
| 排卵日 | 1天 | Day 14 |
| 黄体期 | 14天 | Day 15-28 |

**关键算法细节：**
- 排卵日锚定在预测下次经期前 14 天（生理学硬规律）
- `diffDays` 数日期差而非包含端点，所有阈值 +1 补偿
- 黄体期固定 ≈14 天（全周期最稳定）
- 卵泡期可变——经期结束日决定了它的长短
- `FERTILITY_WINDOW = 3` 仅影响日历备孕窗口着色，不影响阶段计算
- 一次标记 = 一个预测周期，不向前回溯，不向前外推超过一个周期

### 4.4 动态经期天数

`period_records` 表含 `end_date` 列（可为 null）。用户标记经期结束后：
- `getAveragePeriodDays(records)` 从有 `end_date` 的记录取实际天数均值
- 回退：间距估算（周期的 20%）→ 默认 5 天
- 混合公式：< 3 条数据时加权向默认值靠拢
- `getPhaseForCalendarDay` 优先使用当前周期的 `end_date`
- `computeStats` 也直接用 `end_date`

### 4.5 经期结束按钮
- 日历弹窗 + 首页「经期结束了」按钮
- 仅在经期进行中（`end_date == null`）且距开始日 2-9 天时显示
- 点击后 `updateEndDate(startDate, selectedDate)` 乐观刷新

### 4.6 通知系统

**单一原生闹钟**：`DailyAlarmModule.kt` 桥接 JS 层，`DailyNotificationReceiver.kt` 在闹钟触发时：
1. 读 `period_records` 数据库（含 `end_date`）
2. 计算当前阶段（与 JS 端同算法）
3. 实时抓天气（高德 API → Open-Meteo）
4. 构建富文本通知：天气 + 阶段建议 + 饮食 + 周期事件

**通知内容结构：**
| 行 | 内容 |
|----|------|
| 1 | 天气 + 阶段生活建议（4阶段 × 4天气 = 16种文案） |
| 2 | 饮食建议（每阶段固定一条） |
| 3 | 周期事件（提前2-3天/1天/经期结束/推迟/排卵日） |

**权限：**
- `POST_NOTIFICATIONS` — 通知权限
- `SCHEDULE_EXACT_ALARM` — 精准闹钟（Android 12+）
- 自启动 / 省电豁免 — 在 OnboardingModal 引导开启

### 4.7 症状图标

所有图标是手绘 SVG（24×24 viewBox），文件在 `src/components/Icon.tsx`。每个症状对应唯一图标，无重复使用。

---

## 5. 打包发布

### 本地打 APK
```bash
cd android
GRADLE_BIN=... assembleRelease -PreactNativeArchitectures=arm64-v8a
```
输出：`android/app/build/outputs/apk/release/app-release.apk`

### 云构建 (EAS)
```bash
npx eas build --platform android --profile preview
```
https://expo.dev/accounts/y-y/projects/period-tracker/builds

### 构建前检查清单
- [ ] TS 编译无错：`npx tsc --noEmit`
- [ ] `C:/pt/` 目录存在（Gradle 用 X: 虚拟盘 ~ C:\AllProject\period-tracker）
- [ ] `package-lock.json` 与 `package.json` 一致
- [ ] `app.json` 无 `splash` 键
- [ ] 各 mipmap 目录无 `.png` + `.webp` 重复

---

## 6. 已知问题

1. **包版本不匹配** — `@react-native-async-storage/async-storage` 3.1.1（SDK manifest 要求 2.2.0），但 3.x 向下兼容。
2. ~~**通知不弹** — 之前是 WAL 只读 + 权限 + 进程被杀的综合问题，已修复（OPEN_READWRITE + AlarmManager + goAsync + WakeLock + 自启动引导）。~~
3. ~~**两个启动页** — 曾因 expo-splash-screen 与原生 splash_bg.xml 叠加，已移除 expo-splash-screen npm 包。~~
4. ~~**黄体期12天** — OVULATION_SPAN=3 挤占了黄体期，已改为 1 天排卵日 + 日历备孕窗口着色。~~

---

## 7. 账号信息

| 服务 | 账号 |
|------|------|
| GitHub | usernameycx |
| Expo/EAS | y-y / 1750052268@qq.com |
| EAS 项目 ID | `24afc54a-8086-48cd-bb4d-0c24cad0a848` |
| keystore | 由 Expo 托管 (Build Credentials Ws3nuqf6mZ) |

---

## 8. 后续可能要做

- iOS 适配（当前仅 Android）
- 图表统计（用数据可视化展示周期变化）
- 多语言支持
- 云同步备份
