import { Pressable, useColorScheme, StyleSheet, View } from "react-native";
import { Plus } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { GlassWrapper } from "./GlassWrapper";
import { useGlassEffect } from "@/hooks/useGlassEffect";
import { BRAND_COLORS } from "@/constants/colors";

interface FloatingPlusButtonProps {
  onPress: () => void;
}

/**
 * Purple-tinted glass button with plus icon for creating new tasks.
 * Uses native iOS 26 glass effect when available, falls back to BlurView.
 */
export function FloatingPlusButton({ onPress }: FloatingPlusButtonProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { isAvailable: isGlassAvailable } = useGlassEffect();

  const borderColor = isDark
    ? "rgba(255,255,255,0.2)"
    : "rgba(255,255,255,0.3)";

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        // Use scale transform only for pressed state (opacity breaks glass effect)
        pressed && styles.pressed,
      ]}
    >
      <GlassWrapper
        style={styles.glassView}
        glassStyle="clear"
        tintColor={BRAND_COLORS.primary}
        isInteractive={false}
        fallbackIntensity={80}
        fallbackBackgroundColor="rgba(99,102,241,0.85)"
      >
        <View
          style={[
            styles.innerContainer,
            // Only show border/background on fallback mode
            !isGlassAvailable && {
              borderColor,
              backgroundColor: "rgba(99,102,241,0.85)",
            },
          ]}
        >
          <Plus size={24} color="#FFFFFF" strokeWidth={2.5} />
        </View>
      </GlassWrapper>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
    // Shadow for depth
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  pressed: {
    // Avoid opacity < 1 on glass effect, use scale only
    transform: [{ scale: 0.96 }],
  },
  glassView: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
  },
  innerContainer: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.5,
    borderRadius: 24,
    borderColor: "transparent",
  },
});
