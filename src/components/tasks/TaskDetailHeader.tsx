import { View, Text, Pressable, useColorScheme } from "react-native";
import { X, Check } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { BRAND_COLORS, IOS_GRAYS } from "@/constants/colors";

interface TaskDetailHeaderProps {
  title: string;
  onSave?: () => void;
  saveDisabled?: boolean;
}

/**
 * Header for the task detail sheet when fully expanded.
 * Shows dismiss button on left, title center, save button on right.
 */
export function TaskDetailHeader({ title, onSave, saveDisabled = true }: TaskDetailHeaderProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const handleDismiss = () => {
    Haptics.selectionAsync();
    router.back();
  };

  const handleSave = () => {
    if (onSave && !saveDisabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSave();
    }
  };

  const iconColor = isDark ? "#FFFFFF" : "#000000";
  const disabledColor = isDark ? IOS_GRAYS.gray3 : IOS_GRAYS.gray4;

  return (
    <View className="flex-row items-center justify-between px-4 py-3 border-b border-separator dark:border-separator-dark">
      {/* Dismiss button */}
      <Pressable
        onPress={handleDismiss}
        className="w-10 h-10 items-center justify-center rounded-full active:opacity-70"
        accessibilityLabel="Close"
        accessibilityRole="button"
      >
        <X size={24} color={iconColor} strokeWidth={2} />
      </Pressable>

      {/* Title */}
      <Text
        className="flex-1 text-center text-[17px] font-semibold text-label-primary dark:text-label-dark-primary"
        numberOfLines={1}
      >
        {title}
      </Text>

      {/* Save button (disabled until writes are implemented) */}
      <Pressable
        onPress={handleSave}
        disabled={saveDisabled}
        className="w-10 h-10 items-center justify-center rounded-full active:opacity-70"
        accessibilityLabel="Save"
        accessibilityRole="button"
        accessibilityState={{ disabled: saveDisabled }}
      >
        <Check
          size={24}
          color={saveDisabled ? disabledColor : BRAND_COLORS.primary}
          strokeWidth={2}
        />
      </Pressable>
    </View>
  );
}
