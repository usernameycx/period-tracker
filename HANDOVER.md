# FayeTide 项目交接文档 v2.0

> 经期追踪 App · Expo SDK 57 · 2026年7月

---

## 1. 项目概览

**FayeTide** 是一款基于 React Native (Expo) 的经期追踪应用，面向中文女性用户。

| 项 | 值 |
|---|-----|
| 仓库 | https://github.com/usernameycx/period-tracker |
| 分支 | `feature/initial-app` |
| 版本 | 2.0.0 (versionCode 2) |
| App 名称 | FayeTide |
| 包名 | `com.periodtracker.app` |

### 功能
- 经期记录（含结束日标记）
- 科学周期预测（5-8-1-14 天模型）
- 日历视图（含备孕窗口标注）
- 每日症状记录（出血量/小腹不适感/今日心情/精力状态/头痛/腹胀/腰痛/胸胀/眼干）
- 每日饮食建议（全周期 31 天逐日推荐）
- 天气感知生活建议（6 级温度分层）
- 原生闹钟每日播报（含阶段+天气+饮食+周期事件）
- 数据导出/导入（JSON 文件分享+粘贴）

---

## 2. 环境搭建

```bash
git clone https://github.com/usernameycx/period-tracker.git
cd period-tracker
git checkout feature/initial-app
npm install
```

### 本地构建 APK
```bash
# arm64-v8a (真机)
cd android
GRADLE_BIN="$HOME/.gradle/wrapper/dists/gradle-9.3.1-bin/8t615y5yb9wd0ztz5bhxung2w/gradle-9.3.1/bin/gradle"
"$GRADLE_BIN" assembleRelease -PreactNativeArchitectures=arm64-v8a
# → android/app/build/outputs/apk/release/app-release.apk

# 用 X: 虚拟驱动器避免 CMake 260字符路径限制
cmd //c "subst X: C:\path\to\project"
cd X:/android
"$GRADLE_BIN" assembleRelease -PreactNativeArchitectures=arm64-v8a
```

---

## 3. 项目结构

```
app/                  # 页面
  _layout.tsx         # 全局 providers + 启动屏
  (tabs)/
    index.tsx         # 首页
    calendar.tsx      # 日历页
    settings.tsx      # 设置（通知时间/城市/备份/清理）

src/
  components/         # UI 组件 (40+ 个)
  context/            # React Context ×4
  hooks/              # useCurrentPhase
  services/           # 预测/天气/农历/通知/统计/建议/名言
  db/                 # SQLite (period_records/diet_rules/symptoms)
  constants/          # 主题/阶段/症状/天气建议
  utils/              # 日期/备份

android/              # Android 原生项目（已提交 git）
  app/src/main/java/com/periodtracker/app/
    MainApplication.kt / MainActivity.kt
    DailyAlarmModule.kt           # JS ↔ 原生闹钟桥接
    DailyNotificationReceiver.kt  # 闹钟接收器（读DB+天气+推送）
```

### 核心文件速查

| 文件 | 作用 |
|------|------|
| `constants/phases.ts` | 阶段常量、颜色、默认天数 |
| `services/prediction.ts` | 周期预测（阶段划分、平均天数、日历着色） |
| `services/stats.ts` | 统计（end_date 优先） |
| `services/advice.ts` | 生活建议（JS端） |
| `services/notifications.ts` | 通知调度（JS端） |
| `constants/weather-advice.ts` | 天气码→建议映射（含温度分层） |
| `db/diet-rules.ts` | 饮食规则（种子数据 + CRUD） |
| `db/database.ts` | SQLite 初始化（WAL 模式） |
| `components/Icon.tsx` | 全部 SVG 图标 |
| `components/SymptomPicker.tsx` | 症状记录 UI |
| `components/CalendarView.tsx` | 日历月视图 |
| `DailyNotificationReceiver.kt` | 原生通知（含 buildRichBody） |
| `DailyAlarmModule.kt` | 原生闹钟桥接 |

---

## 4. 周期预测模型（2.0）

```
28天标准周期：
Day 1-5:   经期    5天   珊瑚粉 #F2D5C5
Day 6-13:  卵泡期  8天   嫩绿   #D6E4D0
Day 13:    备孕窗口 1天  浅米   #F5EDD8（仅日历着色）
Day 14:    排卵日  1天   蜜桃橙 #F0C8A0
Day 15-28: 黄体期 14天   浅鹅黄 #F0DEB8
```

- 排卵日锚定下一次经期前 14 天
- `diffDays` 数日期差，阈值 +1 补偿
- 黄体期固定 14 天（生理学硬规律）
- 卵泡期随经期结束日浮动
- 备孕窗口仅日历着色，不影响阶段名

### 动态经期天数
- `period_records.end_date` 为 null 时用默认 5 天
- 标记结束后取历史实际天数均值
- 稀疏数据加权混合默认值

---

## 5. 通知系统

单一原生 `AlarmManager` 闹钟 + `DailyNotificationReceiver`。

**触发时（接收器 goAsync + WakeLock）：**
1. 读 period_records（含 end_date，OPEN_READWRITE 回放 WAL）
2. 计算阶段（与 JS 同算法）
3. 实时抓天气（高德→坐标→Open-Meteo）
4. 构建通知：天气+建议 / 饮食 / 周期事件

**权限：** POST_NOTIFICATIONS / SCHEDULE_EXACT_ALARM / 自启动引导

---

## 6. 数据备份

**导出：** `expo-file-system` 写 JSON → `expo-sharing` 分享文件  
**导入：** 支持粘贴 JSON + 文件选择器（`expo-document-picker`）  
**数据含：** period_records（含 end_date）、diet_rules、symptoms、settings

---

## 7. 已知问题

1. `@react-native-async-storage/async-storage` 版本 3.1.1 与 SDK manifest 要求 2.2.0 不匹配，向下兼容不影响。
2. 首次安装后旧 DB 不含 `backPain/breastPain/skinSensitive` 列，SQLite `INSERT OR REPLACE` 会失败。新安装不存在此问题。

---

## 8. 账号信息

| 服务 | 账号 |
|------|------|
| GitHub | usernameycx |
| Expo/EAS | y-y / 1750052268@qq.com |

---

## 9. 待办

- iOS 适配
- 图表统计（周期趋势可视化）
- 多语言
- 云同步
