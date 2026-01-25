import { View, Text, Pressable, Linking } from "react-native";
import * as Haptics from "expo-haptics";
import { Circle, CheckCircle2, ChevronRight, Link } from "lucide-react-native";
import type { Task } from "@/types/task";
import { BRAND_COLORS, IOS_GRAYS } from "@/constants/colors";
import { useColorScheme } from "react-native";

interface TaskRowProps {
  task: Task;
  onPress?: () => void;
  showSeparator?: boolean;
}

export function TaskRow({ task, onPress }: TaskRowProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const handlePress = () => {
    Haptics.selectionAsync();
    if (onPress) {
      onPress();
    } else if (task.notionUrl) {
      Linking.openURL(task.notionUrl);
    }
  };

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (task.notionUrl) {
      Linking.openURL(task.notionUrl);
    }
  };

  // Format date for display
  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    }
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const displayDate = formatDate(task.doDate) || formatDate(task.dueDate);
  const isComplete = task.status.group === "complete";

  // Build metadata string (project · date · link indicator)
  const metaParts: string[] = [];
  if (task.project) metaParts.push(task.project);
  if (displayDate) metaParts.push(displayDate);
  const metaString = metaParts.join(" · ");

  // Build accessibility label
  const accessibilityParts = [task.title, `Status: ${task.status.name}`];
  if (task.project) accessibilityParts.push(`Project: ${task.project}`);
  if (task.taskType) accessibilityParts.push(`Type: ${task.taskType}`);
  if (displayDate) accessibilityParts.push(displayDate);
  const accessibilityLabel = accessibilityParts.join(". ");

  const checkboxColor = isComplete ? BRAND_COLORS.primary : (isDark ? IOS_GRAYS.gray3 : IOS_GRAYS.gray3);
  const chevronColor = isDark ? IOS_GRAYS.gray3 : IOS_GRAYS.gray3;
  const linkColor = isDark ? IOS_GRAYS.gray2 : IOS_GRAYS.system;

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={handleLongPress}
      className="flex-row items-center px-4 py-3 min-h-[44px] bg-background-elevated dark:bg-background-dark-elevated active:opacity-70"
      accessible={true}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Double tap to open in Notion"
      accessibilityRole="button"
    >
      {/* Checkbox */}
      <View className="w-6 h-6 items-center justify-center">
        {isComplete ? (
          <CheckCircle2 size={22} color={checkboxColor} strokeWidth={2} />
        ) : (
          <Circle size={22} color={checkboxColor} strokeWidth={1.5} />
        )}
      </View>

      {/* Content */}
      <View className="flex-1 ml-3">
        <Text
          className={`text-[17px] leading-tight ${
            isComplete
              ? "text-label-secondary dark:text-label-dark-secondary line-through"
              : "text-label-primary dark:text-label-dark-primary"
          }`}
          numberOfLines={2}
          accessible={false}
        >
          {task.title}
        </Text>

        {/* Meta row */}
        {(metaString || task.url) && (
          <View className="flex-row items-center mt-0.5" accessible={false}>
            {metaString && (
              <Text className="text-[15px] text-label-secondary dark:text-label-dark-secondary">
                {metaString}
              </Text>
            )}
            {task.url && (
              <Link
                size={12}
                color={linkColor}
                strokeWidth={2}
                style={{ marginLeft: metaString ? 6 : 0 }}
              />
            )}
          </View>
        )}
      </View>

      {/* Disclosure indicator */}
      <ChevronRight size={20} color={chevronColor} strokeWidth={2} />
    </Pressable>
  );
}
