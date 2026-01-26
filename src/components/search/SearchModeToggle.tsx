import { View, Text, Pressable, StyleSheet, useColorScheme } from "react-native";
import { Cloud, Smartphone } from "lucide-react-native";
import * as Haptics from "expo-haptics";
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

  const bgColor = isDark ? IOS_BACKGROUNDS.elevated.dark : IOS_GRAYS.gray6;
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

  return (
    <View style={styles.container}>
      <View style={[styles.toggleContainer, { backgroundColor: bgColor }]}>
        {/* Online option */}
        <Pressable
          onPress={() => handlePress("online")}
          disabled={isOnlineDisabled}
          style={[
            styles.option,
            mode === "online" && !isOnlineDisabled && styles.optionActive,
            mode === "online" && !isOnlineDisabled && { backgroundColor: BRAND_COLORS.primary },
          ]}
        >
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
          />
          <Text
            style={[
              styles.optionText,
              {
                color: isOnlineDisabled
                  ? disabledColor
                  : mode === "online"
                  ? activeTextColor
                  : inactiveTextColor,
              },
            ]}
          >
            Online
          </Text>
        </Pressable>

        {/* Local option */}
        <Pressable
          onPress={() => handlePress("local")}
          style={[
            styles.option,
            mode === "local" && styles.optionActive,
            mode === "local" && { backgroundColor: BRAND_COLORS.primary },
          ]}
        >
          <Smartphone
            size={16}
            color={mode === "local" ? activeTextColor : inactiveTextColor}
            strokeWidth={2}
          />
          <Text
            style={[
              styles.optionText,
              { color: mode === "local" ? activeTextColor : inactiveTextColor },
            ]}
          >
            Local
          </Text>
        </Pressable>
      </View>

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
    borderRadius: 8,
    padding: 2,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 6,
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
    fontWeight: "500",
  },
  subtitle: {
    fontSize: 12,
    marginTop: 6,
  },
});
