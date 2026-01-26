import { useMemo } from "react";
import { Platform } from "react-native";
import { isLiquidGlassAvailable } from "expo-glass-effect";

/**
 * Hook that determines if the native glass effect should be used.
 * Returns true only on iOS 26+ where the Liquid Glass API is available.
 */
export function useGlassEffect() {
  return useMemo(() => {
    // Only available on iOS
    if (Platform.OS !== "ios") {
      return { isAvailable: false };
    }

    // Check runtime availability
    return { isAvailable: isLiquidGlassAvailable() };
  }, []);
}
