import { View, Text, useColorScheme, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { Search } from "lucide-react-native";
import { IOS_GRAYS } from "@/constants/colors";

/**
 * Non-functional search bar placeholder with iOS 26-style glass effect.
 */
export function FloatingSearchBar() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const iconColor = isDark ? IOS_GRAYS.gray3 : IOS_GRAYS.system;
  const textColor = isDark ? IOS_GRAYS.gray3 : IOS_GRAYS.system;
  const borderColor = isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.05)";

  return (
    <View style={styles.container}>
      <BlurView
        intensity={80}
        tint={isDark ? "dark" : "light"}
        style={styles.blurView}
      >
        <View
          style={[
            styles.innerContainer,
            {
              borderColor,
              backgroundColor: isDark
                ? "rgba(255,255,255,0.05)"
                : "rgba(255,255,255,0.5)",
            },
          ]}
        >
          <Search size={18} color={iconColor} strokeWidth={2} />
          <Text style={[styles.placeholderText, { color: textColor }]}>
            Search
          </Text>
        </View>
      </BlurView>
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
  blurView: {
    flex: 1,
    borderRadius: 24,
    overflow: "hidden",
  },
  innerContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderWidth: 0.5,
    borderRadius: 24,
  },
  placeholderText: {
    fontSize: 17,
    marginLeft: 10,
  },
});
