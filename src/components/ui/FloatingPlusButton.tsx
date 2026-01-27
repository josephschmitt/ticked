import { Pressable, useColorScheme, StyleSheet, View } from "react-native";
import { Plus } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { GlassWrapper } from "./GlassWrapper";
import { useGlassEffect } from "@/hooks/useGlassEffect";
import { BRAND_COLORS } from "@/constants/colors";
import { useMacSizing } from "@/hooks/useMacSizing";
import { useMemo } from "react";

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
  const { minHeight, iconSize } = useMacSizing();

  const borderColor = isDark
    ? "rgba(255,255,255,0.2)"
    : "rgba(255,255,255,0.3)";

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  const dynamicStyles = useMemo(() => {
    const size = minHeight.floatingElement;
    const radius = size / 2;
    return StyleSheet.create({
      container: {
        width: size,
        height: size,
        borderRadius: radius,
        overflow: "hidden",
        shadowColor: "#6366f1",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
      },
      pressed: {
        transform: [{ scale: 0.96 }],
      },
      glassView: {
        width: size,
        height: size,
        borderRadius: radius,
        overflow: "hidden",
      },
      innerContainer: {
        width: size,
        height: size,
        alignItems: "center" as const,
        justifyContent: "center" as const,
        borderWidth: 0.5,
        borderRadius: radius,
        borderColor: "transparent",
      },
    });
  }, [minHeight.floatingElement]);

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        dynamicStyles.container,
        // Use scale transform only for pressed state (opacity breaks glass effect)
        pressed && dynamicStyles.pressed,
      ]}
    >
      <GlassWrapper
        style={dynamicStyles.glassView}
        glassStyle="clear"
        tintColor={BRAND_COLORS.primary}
        isInteractive={false}
        fallbackIntensity={80}
        fallbackBackgroundColor="rgba(99,102,241,0.85)"
      >
        <View
          style={[
            dynamicStyles.innerContainer,
            // Only show border/background on fallback mode
            !isGlassAvailable && {
              borderColor,
              backgroundColor: "rgba(99,102,241,0.85)",
            },
          ]}
        >
          <Plus size={iconSize.large} color="#FFFFFF" strokeWidth={2.5} />
        </View>
      </GlassWrapper>
    </Pressable>
  );
}

