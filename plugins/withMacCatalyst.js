const {
  withXcodeProject,
  withInfoPlist,
  withEntitlementsPlist,
  withDangerousMod,
} = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

/**
 * Expo config plugin to enable Mac Catalyst support
 *
 * This plugin:
 * - Enables Mac Catalyst as a supported destination
 * - Sets "Optimize Interface for Mac" for native Mac controls
 * - Configures the minimum macOS deployment target
 * - Adds keychain-access-groups entitlement for SecureStore
 * - Modifies Podfile to enable mac_catalyst_enabled
 * - Sets scheme to use Release build by default
 */

function withMacCatalystProject(config) {
  return withXcodeProject(config, async (config) => {
    const xcodeProject = config.modResults;

    // Get the main target
    const targetName = config.modRequest.projectName;
    const targets = xcodeProject.pbxNativeTargetSection();

    for (const key in targets) {
      const target = targets[key];
      if (target.name === targetName) {
        const buildConfigListId = target.buildConfigurationList;
        const configList =
          xcodeProject.pbxXCConfigurationList()[buildConfigListId];

        if (configList && configList.buildConfigurations) {
          configList.buildConfigurations.forEach((buildConfigRef) => {
            const buildConfigId = buildConfigRef.value;
            const buildConfig =
              xcodeProject.pbxXCBuildConfigurationSection()[buildConfigId];

            if (buildConfig && buildConfig.buildSettings) {
              // Enable Mac Catalyst
              buildConfig.buildSettings.SUPPORTS_MACCATALYST = "YES";

              // Derive bundle identifier for Mac
              buildConfig.buildSettings.DERIVE_MACCATALYST_PRODUCT_BUNDLE_IDENTIFIER =
                "YES";

              // Disable "Designed for iPad" (we want true Catalyst)
              buildConfig.buildSettings.SUPPORTS_MAC_DESIGNED_FOR_IPHONE_IPAD =
                "NO";

              // Disable "Designed for Vision Pro"
              buildConfig.buildSettings.SUPPORTS_XR_DESIGNED_FOR_IPHONE_IPAD =
                "NO";

              // Set minimum macOS version (Catalyst requires 10.15+)
              buildConfig.buildSettings.MACOSX_DEPLOYMENT_TARGET = "14.0";

              // Enable "Optimize Interface for Mac" (not scaled)
              // Device families: 1=iPhone, 2=iPad, 6=Mac (optimized)
              // Including 6 enables native Mac controls instead of scaled iPad UI
              buildConfig.buildSettings.TARGETED_DEVICE_FAMILY = '"1,2,6"';
            }
          });
        }
      }
    }

    return config;
  });
}

function withMacCatalystPlist(config) {
  return withInfoPlist(config, async (config) => {
    // Enable Mac Catalyst application scene manifest settings
    config.modResults.UIApplicationSceneManifest =
      config.modResults.UIApplicationSceneManifest || {};

    // Support multiple windows on Mac
    config.modResults.UIApplicationSupportsMultipleScenes = true;

    // Hide titlebar background (transparent titlebar, keep traffic lights)
    // This makes the window chrome blend with the content
    config.modResults.NSWindowTitleHidden = true;

    return config;
  });
}

function withMacCatalystEntitlements(config) {
  return withEntitlementsPlist(config, async (config) => {
    // Add keychain access groups for SecureStore to work on Mac Catalyst
    // The $(AppIdentifierPrefix) is automatically replaced by Xcode with the team ID
    const bundleId = config.ios?.bundleIdentifier || "com.ticked.app";
    config.modResults["keychain-access-groups"] = [
      `$(AppIdentifierPrefix)${bundleId}`,
    ];

    return config;
  });
}

function withMacCatalystPodfile(config) {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const podfilePath = path.join(
        config.modRequest.platformProjectRoot,
        "Podfile"
      );
      const podfilePropsPath = path.join(
        config.modRequest.platformProjectRoot,
        "Podfile.properties.json"
      );

      // Modify Podfile
      let podfileContent = fs.readFileSync(podfilePath, "utf8");

      // Enable mac_catalyst_enabled in react_native_post_install
      podfileContent = podfileContent.replace(
        /:mac_catalyst_enabled => false/g,
        ":mac_catalyst_enabled => true"
      );

      fs.writeFileSync(podfilePath, podfileContent);

      // Modify Podfile.properties.json to build RN from source
      // This avoids the prebuilt React.framework which has an ambiguous
      // bundle format that breaks codesign on Mac Catalyst
      let podfileProps = JSON.parse(fs.readFileSync(podfilePropsPath, "utf8"));
      podfileProps["ios.buildReactNativeFromSource"] = "true";
      fs.writeFileSync(podfilePropsPath, JSON.stringify(podfileProps, null, 2));

      return config;
    },
  ]);
}

function withMacCatalystScheme(config) {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const projectName = config.modRequest.projectName;
      const schemePath = path.join(
        config.modRequest.platformProjectRoot,
        `${projectName}.xcodeproj`,
        "xcshareddata",
        "xcschemes",
        `${projectName}.xcscheme`
      );

      if (fs.existsSync(schemePath)) {
        let schemeContent = fs.readFileSync(schemePath, "utf8");

        // Change LaunchAction buildConfiguration from Release to Debug
        schemeContent = schemeContent.replace(
          /(<LaunchAction[^>]*buildConfiguration\s*=\s*)"Release"/g,
          '$1"Debug"'
        );

        fs.writeFileSync(schemePath, schemeContent);
      }

      return config;
    },
  ]);
}

function withMacCatalyst(config, options = {}) {
  config = withMacCatalystProject(config);
  config = withMacCatalystPlist(config);
  config = withMacCatalystEntitlements(config);
  config = withMacCatalystPodfile(config);
  config = withMacCatalystScheme(config);
  return config;
}

module.exports = withMacCatalyst;
