import { ReactNode } from "react";
import { View, ViewStyle, StyleProp, useColorScheme } from "react-native";
import { BlurView } from "expo-blur";
import { GlassView, GlassStyle } from "expo-glass-effect";
import { useGlassEffect } from "@/hooks/useGlassEffect";

interface GlassWrapperProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Glass effect style - 'clear' for minimal effect, 'regular' for standard */
  glassStyle?: GlassStyle;
  /** Tint color for the glass effect (hex color string) */
  tintColor?: string;
  /** Whether the glass should respond to interactions */
  isInteractive?: boolean;
  /** BlurView intensity for fallback (default: 80) */
  fallbackIntensity?: number;
  /** Background color for fallback inner container */
  fallbackBackgroundColor?: string;
}

/**
 * Platform-aware glass effect wrapper.
 * Uses native GlassView on iOS 26+, falls back to BlurView on other platforms.
 */
export function GlassWrapper({
  children,
  style,
  glassStyle = "regular",
  tintColor,
  isInteractive = false,
  fallbackIntensity = 80,
  fallbackBackgroundColor,
}: GlassWrapperProps) {
  const { isAvailable } = useGlassEffect();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Use native GlassView on iOS 26+
  if (isAvailable) {
    return (
      <GlassView
        style={style}
        glassEffectStyle={glassStyle}
        tintColor={tintColor}
        isInteractive={isInteractive}
      >
        {children}
      </GlassView>
    );
  }

  // Fallback to BlurView for older iOS/Android
  return (
    <BlurView
      intensity={fallbackIntensity}
      tint={isDark ? "dark" : "light"}
      style={style}
    >
      <View
        style={[
          { flex: 1 },
          fallbackBackgroundColor
            ? { backgroundColor: fallbackBackgroundColor }
            : undefined,
        ]}
      >
        {children}
      </View>
    </BlurView>
  );
}
