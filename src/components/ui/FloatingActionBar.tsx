import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassContainer } from "expo-glass-effect";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { useGlassEffect } from "@/hooks/useGlassEffect";
import { FloatingSearchBar } from "./FloatingSearchBar";
import { FloatingPlusButton } from "./FloatingPlusButton";

interface FloatingActionBarProps {
  onCreatePress: () => void;
}

/**
 * Floating action bar positioned at the bottom of the screen.
 * Contains a search bar placeholder and a create button.
 * Wraps components in GlassContainer on iOS 26+ for unified glass effect.
 */
export function FloatingActionBar({ onCreatePress }: FloatingActionBarProps) {
  const insets = useSafeAreaInsets();
  const { horizontalPadding, shouldConstrain } = useResponsiveLayout();
  const { isAvailable: isGlassAvailable } = useGlassEffect();

  // Calculate padding - use safe area bottom or minimum of 12
  const bottomPadding = Math.max(insets.bottom, 12);

  const containerStyle = [
    styles.container,
    {
      bottom: bottomPadding,
      paddingHorizontal: shouldConstrain ? horizontalPadding + 16 : 16,
    },
  ];

  const content = (
    <>
      <FloatingSearchBar />
      <View style={styles.gap} />
      <FloatingPlusButton onPress={onCreatePress} />
    </>
  );

  // Use GlassContainer on iOS 26+ to enable glass element interaction
  if (isGlassAvailable) {
    return (
      <GlassContainer style={containerStyle} spacing={12}>
        {content}
      </GlassContainer>
    );
  }

  // Fallback to regular View
  return <View style={containerStyle}>{content}</View>;
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
  },
  gap: {
    width: 12,
  },
});
