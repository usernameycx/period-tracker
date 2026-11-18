/**
 * Expo 动态配置
 *
 * app.json 保存所有静态配置；这里只负责把「不该进仓库的东西」——
 * 也就是高德 Web 服务 key —— 从环境变量注入到 `Constants.expoConfig.extra`。
 *
 * 本地开发：把 AMAP_WEB_KEY 写进项目根目录的 `.env`（模板见 `.env.example`），
 *          Expo CLI 会自动加载 .env。
 * EAS Build：在 expo.dev → 项目 → Environment Variables 里配置 AMAP_WEB_KEY，
 *          云端构建时同样能读到。
 */
module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    amapApiKey: process.env.AMAP_WEB_KEY ?? '',
  },
});
