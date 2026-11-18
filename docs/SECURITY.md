# 安全策略

## 支持版本

只对最新发布版本修复安全问题。

| 版本 | 支持 |
|------|------|
| 2.1.x | ✅ |
| < 2.1 | ❌ |

## 报告漏洞

**请不要开公开 Issue。** 请通过 GitHub 的 [Private vulnerability reporting](https://github.com/usernameycx/period-tracker/security/advisories/new) 提交，或在 Issue 中只写「有安全问题，请看私信」并留下联系方式。

我们会在 7 天内响应；确认后会在修复版本发布时致谢（除非你希望匿名）。

## 密钥管理（重要）

本仓库**不包含任何 API key**，这是硬性规则：

| Key | 用途 | 存放位置 |
|-----|------|----------|
| `AMAP_WEB_KEY` | 高德 Web 服务（地理编码 / 天气） | 本地 `.env`、EAS Environment Variables |
| `AMAP_API_KEY` | 高德 Android 定位 SDK | 本地 `android/local.properties`、EAS Environment Variables |

`.env`、`android/local.properties` 均已在 `.gitignore` 中，构建时由 `app.config.js` 与 `android/app/build.gradle` 读入。

### 如果你不小心提交了 key

1. **立刻**去 [高德控制台](https://console.amap.com/dev/key/app) 删除该 key 并新建一个 —— 因为 git 历史是公开且几乎删不干净的，**删代码不等于删 key**
2. 把新 key 写进 `.env` / `android/local.properties`（本地）或 EAS 环境变量（云端）
3. 如果只是刚刚提交、还没 push，可以 `git commit --amend` 或 `git reset --soft HEAD~1` 重来

> 高德 key 泄露的后果是被他人拿去消耗你的免费额度（地理编码、天气调用量），严重时整套服务不可用。

## 本仓库里没有的东西

以下内容被明确排除在版本控制之外：

- 环境变量与密钥（`.env*`、`android/local.properties`）
- 签名证书（`*.jks / *.keystore / *.p12 / *.key`）
- 构建产物（`android/app/build/`、`.expo/`、`dist/`）
- IDE 与 AI 工具目录（`.idea/`、`.claude/`、`.reasonix/` 等）

`android/app/debug.keystore` 是 React Native 模板自带的**公开调试证书**，不用于正式发布；正式包请使用你自己的 keystore。
