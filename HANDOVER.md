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

### 本地运行

```bash
# 启动 Metro 开发服务器
npx expo start

# 直接跑安卓模拟器
npx expo run:android
```

**注意：** 本地调试需要 Expo Go 或开发版 APK，因为 `android/` 原生目录已提交到 git，直接 `expo start` 连接的 Expo Go 可能无法使用所有功能。

### 连接 MuMu 模拟器（Windows）

```bash
# MuMu 默认 ADB 端口
adb connect 127.0.0.1:7555
adb -s emulator-5554 reverse tcp:8081 tcp:8081
npx expo start
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
  services/             # 业务逻辑 (预测、农历、天气、通知)
  db/                   # SQLite 数据库操作
  constants/            # 主题、阶段、症状常量
  utils/                # 日期、备份工具

android/                # Android 原生项目 (已提交)
scripts/
  generate-icons.js     # 图标生成脚本 (需要 sharp)
plugins/                # Expo config plugins (原生注入)
assets/                 # 图片资源
```

### 核心文件

| 文件 | 作用 |
|------|------|
| `src/services/prediction.ts` | 周期预测算法 |
| `src/hooks/useCurrentPhase.ts` | 当前阶段计算 |
| `src/components/Icon.tsx` | 所有 SVG 图标定义 |
| `src/components/SymptomPicker.tsx` | 症状选择 + 图标映射 |
| `src/constants/theme.ts` | 色彩、间距、排版系统 |
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
JS 层:  preventAutoHideAsync() → 3秒后 hideAsync()
```

启动屏 logo 用 `scripts/generate-icons.js` 生成，修改 logo 大小改 `iconMark(700)` 参数后重跑脚本。

### 4.3 周期预测算法

- 默认周期 28 天，经期 5 天
- 一次标记 = 一个预测周期
- 不向前回溯（日期在第一条记录之前 → 不显示阶段）
- 不向前外推超过一个周期

### 4.4 症状图标

所有图标是手绘 SVG（24×24 viewBox），文件在 `src/components/Icon.tsx`。每个症状对应唯一图标，无重复使用。需要新增图标时：

1. 在 `IconName` 类型中添加名称
2. 在 `PATHS` 对象中添加 SVG 实现
3. 在 `SymptomPicker.tsx` 的 `CATEGORIES`/`TOGGLES` 中映射

---

## 5. 打包发布

### 打 APK

```bash
npx eas build --platform android --profile preview
```

构建完成后从 EAS 控制台下载：
https://expo.dev/accounts/y-y/projects/period-tracker/builds

### 构建前检查清单

- [ ] `node scripts/generate-icons.js` 已跑过，图标无过期
- [ ] `android/` 各 mipmap 目录无限 `.png` + `.webp` 重复
- [ ] `package-lock.json` 与 `package.json` 一致
- [ ] `app.json` 无 `splash` 键
- [ ] `eas.json` 的 preview profile 无自定义 `gradleCommand`
- [ ] `npm install` 已跑过

### 常见构建失败原因

| 报错 | 原因 | 解决 |
|------|------|------|
| `Duplicate resources` | mipmap 中 `.png` 和 `.webp` 同名 | 删掉 `.webp` 只留 `.png` |
| `npm ci` lockfile 不一致 | `package.json` 改了但 lockfile 没有 | `git checkout <hash> -- package.json package-lock.json` 回退 |
| `should NOT have 'splash'` | app.json 有 splash 键 | 删除 splash 键 |

---

## 6. 已知问题

1. **本地 Expo Go 无法热更新** — release APK 不连 Metro。需装 Expo Go 或重新打包。
2. **包版本不匹配** — `@react-native-async-storage/async-storage` 3.1.1（SDK manifest 要求 2.2.0），但 3.x 向下兼容，不影响使用。
3. **`src/services/notifications.ts` 有 TS 编译错误** — 预存在问题，不影响构建。

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
- 更智能的周期预测（多周期数据后）
- 图表统计（用数据可视化展示周期变化）
- 多语言支持
- 云同步备份
