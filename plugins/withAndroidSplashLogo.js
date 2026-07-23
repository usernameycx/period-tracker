const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

/**
 * Fixes splash_bg.xml to use splashscreen_logo instead of ic_launcher.
 * This ensures the native splash screen shows the dedicated splash image,
 * not the adaptive app icon (which may render oddly on Android 12+).
 */
function withAndroidSplashLogo(config) {
  return withDangerousMod(config, [
    "android",
    (dangerousConfig) => {
      const splashBgPath = path.join(
        dangerousConfig.modRequest.platformProjectRoot,
        "app",
        "src",
        "main",
        "res",
        "drawable",
        "splash_bg.xml"
      );

      if (fs.existsSync(splashBgPath)) {
        let content = fs.readFileSync(splashBgPath, "utf8");
        // Replace ic_launcher with splashscreen_logo
        content = content.replace(
          /@mipmap\/ic_launcher/g,
          "@drawable/splashscreen_logo"
        );
        fs.writeFileSync(splashBgPath, content);
      }

      return dangerousConfig;
    },
  ]);
}

module.exports = withAndroidSplashLogo;
