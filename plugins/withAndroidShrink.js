const { withAppBuildGradle } = require("@expo/config-plugins");

/**
 * Enables ProGuard minification and resource shrinking for release builds.
 * Reduces APK size by removing unused code and resources.
 */
function withAndroidShrink(config) {
  return withAppBuildGradle(config, (buildGradleConfig) => {
    const gradle = buildGradleConfig.modResults.contents;

    // Ensure shrinkResources is enabled for release builds
    if (!gradle.includes("shrinkResources")) {
      const replacement = gradle.replace(
        /(buildTypes\s*\{[\s\S]*?(release\s*\{[\s\S]*?)(\n\s*\}))(\s*\})/,
        (match, prefix, releaseBlock, closingBrace, buildTypesClosing) => {
          if (releaseBlock.includes("minifyEnabled")) {
            // Already has minifyEnabled, add shrinkResources after it
            return match.replace(
              /(minifyEnabled\s+true[^\n]*)/,
              "$1\n            shrinkResources true"
            );
          }
          // Add both minifyEnabled and shrinkResources
          return match.replace(
            /(release\s*\{)/,
            "$1\n            minifyEnabled true\n            shrinkResources true"
          );
        }
      );

      if (replacement !== gradle) {
        buildGradleConfig.modResults.contents = replacement;
      }
    }

    return buildGradleConfig;
  });
}

module.exports = withAndroidShrink;
