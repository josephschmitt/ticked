import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { FloatingSearchBar } from "./FloatingSearchBar";
import { FloatingPlusButton } from "./FloatingPlusButton";

interface FloatingActionBarProps {
  onCreatePress: () => void;
}

/**
 * Floating action bar positioned at the bottom of the screen.
 * Contains a search bar placeholder and a create button.
 */
export function FloatingActionBar({ onCreatePress }: FloatingActionBarProps) {
  const insets = useSafeAreaInsets();
  const { horizontalPadding, shouldConstrain } = useResponsiveLayout();

  // Calculate padding - use safe area bottom or minimum of 12
  const bottomPadding = Math.max(insets.bottom, 12);

  return (
    <View
      style={[
        styles.container,
        {
          bottom: bottomPadding,
          paddingHorizontal: shouldConstrain ? horizontalPadding + 16 : 16,
        },
      ]}
    >
      <FloatingSearchBar />
      <View style={styles.gap} />
      <FloatingPlusButton onPress={onCreatePress} />
    </View>
  );
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
