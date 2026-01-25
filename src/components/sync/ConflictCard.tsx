import { View, Text, Pressable, useColorScheme } from "react-native";
import { Check, X, Smartphone, Cloud } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { IOS_GRAYS, BRAND_COLORS, IOS_BACKGROUNDS } from "@/constants/colors";
import { getConflictDescription } from "@/services/sync/conflictDetection";
import type { SyncConflict, ConflictResolution } from "@/types/mutation";

interface ConflictCardProps {
  conflict: SyncConflict;
  onResolve: (conflictId: string, resolution: ConflictResolution) => void;
}

/**
 * Card displaying a single sync conflict with resolution options.
 */
export function ConflictCard({ conflict, onResolve }: ConflictCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const description = getConflictDescription(conflict);
  const taskTitle = conflict.mutation.originalTask.title;

  const handleKeepLocal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onResolve(conflict.id, "keepLocal");
  };

  const handleKeepServer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onResolve(conflict.id, "keepServer");
  };

  const cardBg = isDark ? IOS_BACKGROUNDS.elevated.dark : IOS_BACKGROUNDS.elevated.light;
  const borderColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)";
  const textColor = isDark ? IOS_GRAYS.gray5 : IOS_GRAYS.system;
  const secondaryColor = isDark ? IOS_GRAYS.gray4 : IOS_GRAYS.gray2;

  return (
    <View
      className="mx-4 my-2 rounded-xl overflow-hidden"
      style={{
        backgroundColor: cardBg,
        borderWidth: 1,
        borderColor,
      }}
    >
      {/* Header */}
      <View className="px-4 py-3 border-b" style={{ borderColor }}>
        <Text
          className="text-[15px] font-semibold"
          style={{ color: textColor }}
          numberOfLines={1}
        >
          {taskTitle}
        </Text>
      </View>

      {/* Changes comparison */}
      <View className="px-4 py-3">
        {/* Local change */}
        <View className="flex-row items-start mb-3">
          <View
            className="w-8 h-8 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: "rgba(0, 122, 255, 0.15)" }}
          >
            <Smartphone size={16} color={BRAND_COLORS.primary} strokeWidth={2} />
          </View>
          <View className="flex-1">
            <Text
              className="text-[13px] font-medium mb-0.5"
              style={{ color: BRAND_COLORS.primary }}
            >
              Your change
            </Text>
            <Text
              className="text-[14px]"
              style={{ color: textColor }}
            >
              {description.localChange}
            </Text>
          </View>
        </View>

        {/* Server change */}
        <View className="flex-row items-start">
          <View
            className="w-8 h-8 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: "rgba(88, 86, 214, 0.15)" }}
          >
            <Cloud size={16} color="#5856D6" strokeWidth={2} />
          </View>
          <View className="flex-1">
            <Text
              className="text-[13px] font-medium mb-0.5"
              style={{ color: "#5856D6" }}
            >
              Server version
            </Text>
            <Text
              className="text-[14px]"
              style={{ color: textColor }}
            >
              {description.serverChange}
            </Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View className="flex-row border-t" style={{ borderColor }}>
        <Pressable
          onPress={handleKeepLocal}
          className="flex-1 flex-row items-center justify-center py-3 border-r"
          style={({ pressed }) => ({
            borderColor,
            opacity: pressed ? 0.7 : 1,
            backgroundColor: pressed
              ? isDark
                ? "rgba(255,255,255,0.05)"
                : "rgba(0,0,0,0.03)"
              : "transparent",
          })}
        >
          <Smartphone size={16} color={BRAND_COLORS.primary} strokeWidth={2} />
          <Text
            className="text-[14px] font-medium ml-2"
            style={{ color: BRAND_COLORS.primary }}
          >
            Keep mine
          </Text>
        </Pressable>

        <Pressable
          onPress={handleKeepServer}
          className="flex-1 flex-row items-center justify-center py-3"
          style={({ pressed }) => ({
            opacity: pressed ? 0.7 : 1,
            backgroundColor: pressed
              ? isDark
                ? "rgba(255,255,255,0.05)"
                : "rgba(0,0,0,0.03)"
              : "transparent",
          })}
        >
          <Cloud size={16} color="#5856D6" strokeWidth={2} />
          <Text
            className="text-[14px] font-medium ml-2"
            style={{ color: "#5856D6" }}
          >
            Keep server
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
