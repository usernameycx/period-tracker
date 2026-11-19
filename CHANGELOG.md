# 更新日志

本项目自 2.0 起遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)，格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)。

## [Unreleased]

## [3.0.0] - 2026-11-19

### 新增

- **标记经期第一天后即生成整个预测周期**：经期 → 卵泡期 → 排卵日 → 黄体期连续着色，跨月自动衔接
- **日历新增「经期结束」标记**：空心圆点，与「经期开始」的实心圆点成对出现；月历与周条同步，图例补「开始 / 结束」两项
- **「标记经期在此结束」变为可切换状态**：标记后按钮不消失，原地变为「已标记为经期结束（再次点击可取消）」，再次点击即取消结束日
- **设置 → 数据管理支持精细删除**：
  - 经期记录：选择某一个周期或全部（按年份分组）
  - 症状记录：选择某一天或全部（按月份分组，显示星期与记录项数）
  - 新增通用单选弹窗 `OptionListModal`（分组列表、虚拟化、与 ConfirmModal 同一套视觉）

### 修复

- **定位在真机/模拟器上始终失败**：高德定位 SDK 以 jar 形式引入（`com.amap.api:location:6.4.2`），jar 不会像 AAR 那样自动合并 manifest，导致 `com.amap.api.location.APSService` 从未被声明（logcat: `Unable to start service ... APSService not found`）。现已在 `AndroidManifest.xml` 中显式声明，并补 `ACCESS_WIFI_STATE` 权限以提升网络定位成功率。
- **通知里的天气取不到**：`AMAP_WEB_KEY` 原先只写进 `.env`，而 Gradle 只读 `local.properties` / 环境变量，导致 APK 内 `com.fayetide.amap.webkey` 为空。现在 `android/app/build.gradle` 也会读取根目录 `.env`，与 `app.config.js` 共用同一份配置。
- 返回设置页时症状天数不刷新（只在经期记录变化时才重新读取）。
- 删除弹窗里的日期统一显示为「11月19日 周四」并带年份，避免跨年同月同日无法区分。

### 变更

- 版本号提升至 **3.0.0**（versionCode 5）
- **Windows 本地构建 arm64 时固定 CMake 3.31.6**：默认的 3.22.1 带 ninja 1.10，编新架构 codegen（`react-native-gesture-handler` 的 shadow node）会因对象文件路径超过 260 字符而失败；3.31.6 自带 ninja 1.12+ 支持长路径。仅 Windows 生效，EAS/Linux 构建不受影响。
- `README.md`、`CONTRIBUTING.md`、`docs/`（架构 / 隐私 / 安全）与 Issue、PR 模板
- GitHub Actions CI：类型检查 + 单元测试
- `.env.example`：说明两个高德 key 的配置方式
- **高德 key 全部移出仓库**：`app.json` → `app.config.js`（读 `AMAP_WEB_KEY`）；Kotlin 硬编码 → AndroidManifest 占位符（读 `AMAP_WEB_KEY`）；`android/gradle.properties` → `android/local.properties` / 环境变量（`AMAP_API_KEY`）
- 未配置 key 时，天气会给出明确提示「未配置高德 Web 服务 key」，而不是看起来像「城市名写错」
- 清理版本控制中的 IDE / AI 工具目录与临时文件（`.idea`、`.claude`、`.impeccable`、`.trash`、`reasonix.toml`、`HANDOVER.md`）
- LICENSE 从 Expo 模板的 MIT 改为本项目的 MIT

## [2.1.1] - 2026-08-06

### 新增

- 启动自动定位：高德定位成功即切换城市并强制刷新天气
- 记录操作乐观更新 + 300ms 防抖，连续标记不再卡顿
- 每日建议文案随机轮换（避免每天同一句）
- 首次启动引导卡片

### 修复

- 定位初始化失败：补高德隐私合规接口（`updatePrivacyShow` / `updatePrivacyAgree`）
- 权限流程顺序化（定位 → 通知 → 引导），修复权限弹窗挂起
- 定位失败原因透出（含高德错误码），并保留上次正常数据

## [2.1.0] - 2026-07-28

### 新增

- 自定义全局 Toast（6 秒停留 + 800ms 淡出，便于看清定位错误）
- 定位并发互斥：启动定位与手动定位共享同一次请求
- 周期图标重做为 loop 风格

### 变更

- 月历选中态样式多轮打磨（黑边框 + 字重）
- 建议文案长度收敛到 30 字以内

## [2.0.0] - 2026-07-22

### 新增

- 备份从「文件导入」升级为「文件选择器 + 粘贴 + 分享导出」三种方式
- 动态经期天数（`period_records.end_date`）与加权混合预测
- 备孕窗口日历着色
- 症状记录整行反选，清空自动删除空行

### 变更

- 阶段模型定为 5-8-1-14（经期 5 / 卵泡 8 / 排卵 1 / 黄体 14）
- 「排卵期」全量重命名为「排卵日」

## [1.0.0] - 2026-07-18

### 新增

- 首个可用版本：经期记录、四阶段预测、日历、症状记录、饮食建议、农历、每日通知
- Expo Router 三个 Tab 页面与本地 SQLite 数据层
