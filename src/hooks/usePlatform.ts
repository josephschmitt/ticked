import { Platform, Dimensions, useWindowDimensions } from "react-native";

/**
 * Check if we're on iPad.
 */
export function useIsTablet(): boolean {
  const { width, height } = useWindowDimensions();
  const aspectRatio = width / height;

  // Consider tablet if screen is large and not too narrow
  return Platform.OS === "ios" && Math.min(width, height) >= 768;
}

/**
 * Check if we're on Mac Catalyst.
 */
export function useIsMac(): boolean {
  return Platform.OS === "ios" && Platform.isPad === false && Dimensions.get("window").width > 1000;
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
