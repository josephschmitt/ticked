import { Platform, Dimensions, useWindowDimensions } from "react-native";

// Platform constants type with Mac Catalyst properties
interface PlatformConstantsIOS {
  interfaceIdiom?: "phone" | "pad" | "mac" | "tv" | "carplay";
}

/**
 * Check if running on Mac Catalyst with "Optimize for Mac" idiom.
 * This is a static check that doesn't need to be in a hook.
 */
export const isMacCatalyst =
  Platform.OS === "ios" &&
  (Platform.constants as PlatformConstantsIOS).interfaceIdiom === "mac";

/**
 * Check if we're on iPad.
 */
export function useIsTablet(): boolean {
  const { width } = useWindowDimensions();

  // Consider tablet if screen is large and not too narrow
  return Platform.OS === "ios" && Math.min(width, Dimensions.get("window").height) >= 768;
}

/**
 * Check if we're on Mac Catalyst.
 */
export function useIsMac(): boolean {
  return isMacCatalyst;
}

/**
 * Get platform-specific padding values.
 */
export function usePlatformPadding() {
  const isTablet = useIsTablet();

  return {
    horizontal: isTablet ? 32 : 16,
    vertical: isTablet ? 24 : 16,
    contentMaxWidth: isTablet ? 800 : undefined,
  };
}
