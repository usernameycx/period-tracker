const { withAndroidStyles } = require("@expo/config-plugins");

/**
 * Expo config plugin that adds android:windowBackground to AppTheme
 * to eliminate visual flicker when transitioning from the splash screen theme.
 */
function withSplashWindowBackground(config) {
  return withAndroidStyles(config, (androidStylesConfig) => {
    const styles = androidStylesConfig.modResults;
    const stylesArray = Array.isArray(styles.resources?.style)
      ? styles.resources.style
      : [];

    const appTheme = stylesArray.find(
      (s) =>
        s.$?.name === "AppTheme" &&
        s.$?.parent === "Theme.AppCompat.DayNight.NoActionBar"
    );

    if (appTheme) {
      const items = appTheme.item || [];
      const hasWindowBg = items.some(
        (i) => i.$?.name === "android:windowBackground"
      );

      if (!hasWindowBg) {
        items.push({
          $: { name: "android:windowBackground" },
          _: "@color/splashscreen_background",
        });
        appTheme.item = items;
      }
    }

    return androidStylesConfig;
  });
}

module.exports = withSplashWindowBackground;
