import { View, Text, Pressable, useColorScheme } from "react-native";
import { AlertTriangle, ChevronRight } from "lucide-react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { useMutationQueueStore } from "@/stores/mutationQueueStore";
import { IOS_GRAYS } from "@/constants/colors";

/**
 * Banner shown when there are unresolved sync conflicts.
 */
export function ConflictBanner() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const conflictCount = useMutationQueueStore((state) => state.getPendingConflictsCount());

  if (conflictCount === 0) {
    return null;
  }

  const handlePress = () => {
    router.push("/conflicts");
  };

  const backgroundColor = isDark
    ? "rgba(255, 149, 0, 0.15)"
    : "rgba(255, 149, 0, 0.1)";
  const borderColor = "rgba(255, 149, 0, 0.3)";
  const textColor = isDark ? IOS_GRAYS.gray5 : IOS_GRAYS.system;

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
    >
      <Pressable
        onPress={handlePress}
        className="mx-4 my-2 px-4 py-3 rounded-xl flex-row items-center"
        style={{
          backgroundColor,
          borderWidth: 1,
          borderColor,
        }}
      >
        <AlertTriangle size={20} color="#FF9500" strokeWidth={2} />
        <View className="flex-1 ml-3">
          <Text
            className="text-[15px] font-semibold"
            style={{ color: textColor }}
          >
            {conflictCount} sync conflict{conflictCount > 1 ? "s" : ""}
          </Text>
          <Text
            className="text-[13px] mt-0.5"
            style={{ color: isDark ? IOS_GRAYS.gray4 : IOS_GRAYS.gray2 }}
          >
            Tap to review and resolve
          </Text>
        </View>
        <ChevronRight
          size={20}
          color={isDark ? IOS_GRAYS.gray4 : IOS_GRAYS.gray3}
          strokeWidth={2}
        />
      </Pressable>
    </Animated.View>
  );
}
