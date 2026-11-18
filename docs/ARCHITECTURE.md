# 架构说明

> 面向二次开发者的实现细节。想先跑起来请回 [README](../README.md)。

## 1. 运行时结构

```
app/_layout.tsx
└── ErrorBoundary
    └── SettingsProvider        ← AsyncStorage：城市、通知时间、引导状态
        └── PeriodProvider      ← SQLite：period_records
            └── WeatherProvider ← 定位 + 地理编码 + Open-Meteo
                └── StartupFlow         启动时序（权限 → 定位 → 刷新天气）
                └── ToastHost           全局轻提示
                └── Stack (expo-router)
                    └── (tabs)/_layout.tsx
                        └── SelectedDateProvider   ← 首页/日历共享选中日期
                            └── index / calendar / settings
```

Context 全部使用 `useMemo` 包裹 value，避免无意义的下游重渲染。`WeatherProvider` 通过 `useSettings()` 读取城市，因此声明顺序上必须在 `SettingsProvider` 之内。

## 2. 启动时序

`StartupFlow` 每次冷启动执行一次（`startedRef` 防重入），严格串行：

```
延迟 500ms（等 Activity 就绪，避免权限弹窗无法显示而挂起）
  → 请求定位权限（系统弹窗）
  → 请求通知权限（无超时，等用户点击）
  → 放行引导卡片
  → 高德定位 → 拿到城市 → 自动切换城市 + 强制刷新天气
```

设计要点：

- **权限必须串行**：Android 上两个系统弹窗并发会互相抢占，表现为「点了没反应」
- **定位失败不阻塞**：保留上一次正常城市与天气，只弹 Toast 说明原因（含高德错误码）
- **尊重用户选择**：定位期间用户手动切过城市，就不再覆盖
- **天气请求去重**：切城市场景已经手动 `refresh(city)`，`WeatherContext` 用 `manuallyRefreshedCity` 记住，避免 effect 再发一次

## 3. 数据层

`src/db/database.ts` 使用 expo-sqlite，单文件 `period_tracker.db`，开启 `WAL`（读写并发，减少 UI 卡顿）与 `foreign_keys`。初始化用 `CREATE TABLE IF NOT EXISTS` 保证幂等，再用 `seedDietRules` 灌入内置饮食规则。

### Schema

```sql
period_records(
  id INTEGER PK AUTOINCREMENT,
  start_date TEXT NOT NULL UNIQUE,   -- YYYY-MM-DD
  end_date   TEXT,                   -- 可空；标记结束日时写入
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)

diet_rules(
  id INTEGER PK AUTOINCREMENT,
  phase TEXT NOT NULL,               -- period|follicular|ovulation|luteal
  day_offset INTEGER NOT NULL,
  recommend TEXT NOT NULL DEFAULT '[]',  -- JSON 数组
  avoid     TEXT NOT NULL DEFAULT '[]',  -- JSON 数组
  is_builtin INTEGER NOT NULL DEFAULT 1
)

symptoms(
  id INTEGER PK AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,
  flow TEXT, cramps TEXT, mood TEXT, energy TEXT,   -- 四维枚举
  headache INTEGER DEFAULT 0, bloating INTEGER DEFAULT 0,
  cravings INTEGER DEFAULT 0, backPain INTEGER DEFAULT 0,
  breastPain INTEGER DEFAULT 0, skinSensitive INTEGER DEFAULT 0,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)
```

索引：`diet_rules(phase, day_offset)`、`period_records(start_date)`。

设置项（城市、通知时间、引导标记）走 AsyncStorage，不进 SQLite——它们不是业务数据，备份时单独序列化。

### 写入模型

`PeriodContext` 采用**乐观更新**：先改内存状态让 UI 立刻响应，再落库；落库失败则回滚并提示。连续操作（比如连点多个日期）用 300ms 防抖合并，避免重复计算与写放大。

## 4. 周期预测

入口 `src/services/prediction.ts`，三条对外 API：

| 函数 | 用途 |
|------|------|
| `getPhaseForCalendarDay(date, records)` | 日历着色，返回 `{ phase, dayOffset, isFertility } \| null` |
| `getPhaseForDate(date, records)` | 单日阶段（含预测外推） |
| `getAveragePeriodDays(records)` / 统计类 | 动态经期长度 |

算法骨架（以最近一次经期起始 `start` 为锚）：

```
cycleLen  = 相邻 start_date 间隔均值（不足 2 条 → DEFAULT_CYCLE_DAYS = 28）
periodLen = 有 end_date 的记录取均值（不足 3 条 → 与默认 5 天加权混合）
dayOffset = diffDays(start, date) + 1          // 数日期差，故 +1 得到"第几天"

dayOffset ≤ periodLen                     → period
dayOffset ≥ cycleLen - 14                 → luteal（黄体期固定 14 天）
dayOffset == cycleLen - 14                → ovulation（排卵日，1 天）
其余                                       → follicular
```

几个容易踩坑的点：

- **排卵锚点是「下次经期前 14 天」**，不是固定第 14 天；周期变长时排卵会整体后移
- **`diffDays` 语义是日期差（不含首尾）**，所以所有阈值都带 `+1` 补偿，改公式时别漏
- **黄体期固定 14 天**，可变的只有卵泡期——顺序上必须先用 `cycleLen - 14` 判黄体，再判卵泡
- **超出已知记录的日期返回 `null`**，UI 显示占位卡而不是瞎猜

原生通知里有一份 Kotlin 复刻（`DailyNotificationReceiver.kt` 的 `calculatePhase`），改算法时**必须同时改两处**，否则通知与 App 内显示会不一致。`tests/prediction.test.ts` 锁住了 JS 侧行为。

## 5. 天气链路

```
定位：高德定位 SDK（原生 AMapLocationModule）→ { city, lat, lon }
      ↓ 若不可用（iOS / 未装原生模块）→ 手动选城市
地理编码：高德 Web 服务 /v3/geocode/geo → { lat, lon }
      ↓
天气：Open-Meteo /v1/forecast?current=...  → 温度/体感/天气码/UV/湿度/风速
      ↓
派生文案：constants/weather-advice.ts（天气码 → 文案 + emoji，温度 6 级分层）
```

实现上的取舍：

- **只缓存原始数据，不缓存派生文案**：缓存 key 为 `weather_cache_v2_${lat}_${lon}`，TTL 1 小时。这样改了文案映射立刻生效，不会出现「文案是旧的」。
- **请求代际保护**：`requestSeq` 自增，响应回来发现过期就丢弃，避免快速切城市时出现「B 城市名 + A 城市天气」。
- **失败则退到旧数据**：定位/网络失败时尝试用上次坐标的缓存兜底，绝不把界面清空。
- **10 秒超时**：`AbortController`，超时抛「网络请求失败」给卡片展示 + 重试按钮。

> 已知脆弱点：`api.open-meteo.com` 在境内部分网络会出现整段不可达（同门其他子域正常）。当前行为是报错 + 手动重试，计划做主备回退与过期缓存兜底。

## 6. 通知系统

**双通道，同一套内容语义。**

| 通道 | 触发方式 | 适用 |
|------|----------|------|
| 原生 | `AlarmManager.setExact` → `BroadcastReceiver` | Android（默认） |
| JS 兜底 | `expo-notifications` DAILY trigger | iOS / 原生模块缺失 |

原生通道的关键设计是**内容在触发瞬间才算**，而不是调度时算好：

```
闹钟响
 → goAsync + PARTIAL_WAKE_LOCK(30s)   // 争取后台执行时间
 → 打开 SQLite（OPEN_READWRITE，为了回放 WAL）
 → 计算今日阶段（Kotlin 版算法）
 → 实时请求天气（高德地理编码 + Open-Meteo，5s 超时）
 → 拼三行正文：天气+阶段建议 / 饮食 / 周期事件（倒计时、结束、推迟、排卵）
 → showNotification
 → 重排明日闹钟（setExact 是一次性的）
```

这样即使 App 好几天没打开，通知内容依然是最新的（阶段会随日期走）。重复触发用 `last_fire_time` 30 秒窗口去重；开机由 `BOOT_COMPLETED` 重排。

JS 侧 `src/services/notifications.ts` 负责权限、时间设置、以及原生模块缺失时的降级调度。

## 7. 设计系统

`src/constants/theme.ts` 是唯一的样式来源：`Colors / Spacing / FontSize / LineHeight / Radius / Shadow / Weight`。阶段色单独放在 `src/constants/phases.ts`（`PHASE_COLORS`），因为日历着色与组件主题是两回事。

图标全部是 `src/components/Icon.tsx` 里的内联 SVG（24×24 viewBox），没有图标字体、没有位图，因此任意尺寸不糊、跟随主题色。

## 8. 目录职责速查

| 路径 | 职责 |
|------|------|
| `src/services/prediction.ts` | 阶段划分、周期/经期长度推断、日历着色 |
| `src/services/stats.ts` | 统计（`end_date` 优先） |
| `src/services/advice.ts` | 阶段 × 天气 → 生活建议 |
| `src/constants/weather-advice.ts` | 天气码/温度 → 文案（唯一映射源） |
| `src/services/weather.ts` | 地理编码 + Open-Meteo + 缓存 |
| `src/services/location.ts` | 高德定位桥的 JS 封装与错误码翻译 |
| `src/services/lunar.ts` | 农历/干支/宜忌 |
| `src/services/notifications.ts` | 通知权限与调度编排 |
| `src/utils/backup.ts` | 导出/导入序列化与校验 |
| `src/db/*` | SQLite 初始化与各表 CRUD |
| `android/.../DailyNotificationReceiver.kt` | 通知拼装（含 Kotlin 版算法） |

## 9. 修改算法时的检查清单

1. 改 `prediction.ts`
2. 同步 `DailyNotificationReceiver.kt` 的 `calculatePhase`
3. `npm test` 全绿（`tests/prediction.test.ts` 会拦住边界回归）
4. 打开 App 看日历着色与首页倒计时是否一致
5. 手动触发一次通知（把通知时间设成一分钟后）确认文案正确
