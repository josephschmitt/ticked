import { View, Text, Pressable, StyleSheet, useColorScheme } from "react-native";
import { Cloud, Smartphone } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { GlassWrapper } from "@/components/ui/GlassWrapper";
import { useGlassEffect } from "@/hooks/useGlassEffect";
import type { SearchMode } from "@/stores/searchStore";
import { BRAND_COLORS, IOS_GRAYS, IOS_BACKGROUNDS } from "@/constants/colors";

interface SearchModeToggleProps {
  mode: SearchMode;
  onModeChange: (mode: SearchMode) => void;
  /** Whether the toggle is disabled (e.g., when offline) */
  disabled?: boolean;
  /** Message to show below the toggle (e.g., "Last synced: X ago") */
  subtitle?: string;
}

export function SearchModeToggle({
  mode,
  onModeChange,
  disabled = false,
  subtitle,
}: SearchModeToggleProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { isAvailable: isGlassAvailable } = useGlassEffect();

  const fallbackBgColor = isDark ? IOS_BACKGROUNDS.elevated.dark : IOS_GRAYS.gray6;
  const activeTextColor = "#FFFFFF";
  const inactiveTextColor = isDark ? IOS_GRAYS.gray2 : IOS_GRAYS.system;
  const disabledColor = isDark ? IOS_GRAYS.gray2 : IOS_GRAYS.gray3;
  const subtitleColor = isDark ? IOS_GRAYS.gray2 : IOS_GRAYS.system;

  const handlePress = (newMode: SearchMode) => {
    if (disabled && newMode === "online") return;
    if (newMode === mode) return;

    Haptics.selectionAsync();
    onModeChange(newMode);
  };

  const isOnlineDisabled = disabled;

  const renderOption = (
    optionMode: SearchMode,
    icon: React.ReactNode,
    label: string,
    isDisabled: boolean = false
  ) => {
    const isActive = mode === optionMode && !isDisabled;
    const textColor = isDisabled
      ? disabledColor
      : isActive
      ? activeTextColor
      : inactiveTextColor;

    const optionContent = (
      <View style={styles.optionInner}>
        {icon}
        <Text style={[styles.optionText, { color: textColor }]}>{label}</Text>
      </View>
    );

    // Active state with glass effect
    if (isActive && isGlassAvailable) {
      return (
        <Pressable
          key={optionMode}
          onPress={() => handlePress(optionMode)}
          disabled={isDisabled}
          style={styles.option}
        >
          <GlassWrapper
            style={styles.optionGlass}
            glassStyle="regular"
            tintColor={BRAND_COLORS.primary}
            isInteractive={false}
            fallbackBackgroundColor={BRAND_COLORS.primary}
          >
            {optionContent}
          </GlassWrapper>
        </Pressable>
      );
    }

    // Active state without glass (fallback)
    if (isActive) {
      return (
        <Pressable
          key={optionMode}
          onPress={() => handlePress(optionMode)}
          disabled={isDisabled}
          style={[styles.option, styles.optionActive, { backgroundColor: BRAND_COLORS.primary }]}
        >
          {optionContent}
        </Pressable>
      );
    }

    // Inactive state
    return (
      <Pressable
        key={optionMode}
        onPress={() => handlePress(optionMode)}
        disabled={isDisabled}
        style={styles.option}
      >
        {optionContent}
      </Pressable>
    );
  };

  const toggleContent = (
    <>
      {renderOption(
        "online",
        <Cloud
          size={16}
          color={
            isOnlineDisabled
              ? disabledColor
              : mode === "online"
              ? activeTextColor
              : inactiveTextColor
          }
          strokeWidth={2}
        />,
        "Online",
        isOnlineDisabled
      )}
      {renderOption(
        "local",
        <Smartphone
          size={16}
          color={mode === "local" ? activeTextColor : inactiveTextColor}
          strokeWidth={2}
        />,
        "Local"
      )}
    </>
  );

  return (
    <View style={styles.container}>
      {isGlassAvailable ? (
        <GlassWrapper
          style={styles.toggleContainer}
          glassStyle="regular"
          isInteractive={false}
          fallbackBackgroundColor={fallbackBgColor}
        >
          <View style={styles.toggleInner}>{toggleContent}</View>
        </GlassWrapper>
      ) : (
        <View style={[styles.toggleContainer, { backgroundColor: fallbackBgColor }]}>
          {toggleContent}
        </View>
      )}

      {subtitle && (
        <Text style={[styles.subtitle, { color: subtitleColor }]}>{subtitle}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  toggleContainer: {
    flexDirection: "row",
    borderRadius: 10,
    padding: 3,
    overflow: "hidden",
  },
  toggleInner: {
    flexDirection: "row",
  },
  option: {
    borderRadius: 7,
    overflow: "hidden",
  },
  optionGlass: {
    borderRadius: 7,
    overflow: "hidden",
  },
  optionInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 7,
    paddingHorizontal: 16,
    gap: 6,
  },
  optionActive: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  optionText: {
    fontSize: 13,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 12,
    marginTop: 6,
  },
});
