import { Pressable, useColorScheme, StyleSheet, View } from "react-native";
import { BlurView } from "expo-blur";
import { Plus } from "lucide-react-native";
import * as Haptics from "expo-haptics";

interface FloatingPlusButtonProps {
  onPress: () => void;
}

/**
 * Purple-tinted glass button with plus icon for creating new tasks.
 */
export function FloatingPlusButton({ onPress }: FloatingPlusButtonProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const borderColor = isDark ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.3)";

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
    >
      <BlurView
        intensity={80}
        tint={isDark ? "dark" : "light"}
        style={styles.blurView}
      >
        <View
          style={[
            styles.innerContainer,
            { borderColor },
          ]}
        >
          <Plus size={24} color="#FFFFFF" strokeWidth={2.5} />
        </View>
      </BlurView>
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
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
  blurView: {
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
    backgroundColor: "rgba(99,102,241,0.85)", // Purple with slight transparency
    borderWidth: 0.5,
    borderRadius: 24,
  },
});
