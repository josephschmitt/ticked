import { useWindowDimensions } from "react-native";

const DEFAULT_MAX_WIDTH = 700;

/**
 * Hook that calculates responsive layout values for constraining content on wide screens.
 * Returns the horizontal padding needed to center content within maxWidth.
 */
export function useResponsiveLayout(maxWidth: number = DEFAULT_MAX_WIDTH) {
  const { width: windowWidth } = useWindowDimensions();
  const shouldConstrain = windowWidth > maxWidth;
  const horizontalPadding = shouldConstrain ? (windowWidth - maxWidth) / 2 : 0;

  return {
    maxWidth,
    windowWidth,
    shouldConstrain,
    horizontalPadding,
  };
}
