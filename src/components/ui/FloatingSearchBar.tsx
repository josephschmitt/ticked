import { View, Text, useColorScheme, StyleSheet } from "react-native";
import { Search } from "lucide-react-native";
import { GlassWrapper } from "./GlassWrapper";
import { useGlassEffect } from "@/hooks/useGlassEffect";
import { IOS_GRAYS } from "@/constants/colors";

/**
 * Non-functional search bar placeholder with iOS 26-style glass effect.
 * Falls back to BlurView on unsupported platforms.
 */
export function FloatingSearchBar() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { isAvailable: isGlassAvailable } = useGlassEffect();

  const iconColor = isDark ? IOS_GRAYS.gray3 : IOS_GRAYS.system;
  const textColor = isDark ? IOS_GRAYS.gray3 : IOS_GRAYS.system;
  const borderColor = isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.05)";
  const fallbackBgColor = isDark
    ? "rgba(255,255,255,0.05)"
    : "rgba(255,255,255,0.5)";

  return (
    <View style={styles.container}>
      <GlassWrapper
        style={styles.glassView}
        glassStyle="regular"
        isInteractive={false}
        fallbackIntensity={80}
        fallbackBackgroundColor={fallbackBgColor}
      >
        <View
          style={[
            styles.innerContainer,
            // Only show border/background on fallback mode
            !isGlassAvailable && {
              borderColor,
              borderWidth: 0.5,
              backgroundColor: fallbackBgColor,
            },
          ]}
        >
          <Search size={18} color={iconColor} strokeWidth={2} />
          <Text style={[styles.placeholderText, { color: textColor }]}>
            Search
          </Text>
        </View>
      </GlassWrapper>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
  },
  glassView: {
    flex: 1,
    borderRadius: 24,
    overflow: "hidden",
  },
  innerContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderRadius: 24,
  },
  placeholderText: {
    fontSize: 17,
    marginLeft: 10,
  },
});
