import { View, Text, Pressable, Linking, useColorScheme } from "react-native";
import * as Haptics from "expo-haptics";
import { Circle, CheckCircle2, ChevronRight, Link, FolderOpen } from "lucide-react-native";
import { router } from "expo-router";
import type { Task } from "@/types/task";
import { RelationBadge } from "@/components/ui/RelationBadge";
import { BRAND_COLORS, IOS_GRAYS } from "@/constants/colors";

interface TaskRowProps {
  task: Task;
  onPress?: () => void;
  onCheckboxPress?: () => void;
  showSeparator?: boolean;
}

export function TaskRow({ task, onPress, onCheckboxPress }: TaskRowProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Content area tap - opens task detail sheet
  const handleContentPress = () => {
    Haptics.selectionAsync();
    if (onPress) {
      onPress();
    } else {
      // Navigate to task detail sheet
      router.push(`/(main)/task/${task.id}`);
    }
  };

  // Checkbox tap - placeholder for future "mark complete" functionality
  const handleCheckboxPress = () => {
    Haptics.selectionAsync();
    if (onCheckboxPress) {
      onCheckboxPress();
    }
    // No-op for now - reserved for future toggle functionality
  };

  // Long press - opens in Notion
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

  // Check if we have metadata to display
  const hasMetadata = task.project || displayDate || task.url;

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
    <View
      className="flex-row items-center bg-background-elevated dark:bg-background-dark-elevated"
      accessible={true}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
    >
      {/* Checkbox - separate touch target */}
      <Pressable
        onPress={handleCheckboxPress}
        className="pl-4 py-3 pr-1 min-h-[44px] items-center justify-center"
        accessibilityLabel={isComplete ? "Mark incomplete" : "Mark complete"}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isComplete }}
      >
        <View className="w-6 h-6 items-center justify-center">
          {isComplete ? (
            <CheckCircle2 size={22} color={checkboxColor} strokeWidth={2} />
          ) : (
            <Circle size={22} color={checkboxColor} strokeWidth={1.5} />
          )}
        </View>
      </Pressable>

      {/* Content - opens task detail */}
      <Pressable
        onPress={handleContentPress}
        onLongPress={handleLongPress}
        className="flex-1 flex-row items-center py-3 pr-4 min-h-[44px] active:opacity-70"
        accessibilityHint="Tap to view details, long press to open in Notion"
      >
        <View className="flex-1 ml-2">
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
          {hasMetadata && (
            <View className="flex-row items-center mt-0.5" accessible={false}>
              {task.project && (
                <RelationBadge
                  name={task.project}
                  icon={task.projectIcon}
                  fallbackIcon={FolderOpen}
                  size="small"
                />
              )}
              {task.project && displayDate && (
                <Text className="text-[15px] text-label-secondary dark:text-label-dark-secondary mx-1">
                  ·
                </Text>
              )}
              {displayDate && (
                <Text className="text-[15px] text-label-secondary dark:text-label-dark-secondary">
                  {displayDate}
                </Text>
              )}
              {task.url && (
                <Link
                  size={12}
                  color={linkColor}
                  strokeWidth={2}
                  style={{ marginLeft: (task.project || displayDate) ? 6 : 0 }}
                />
              )}
            </View>
          )}
        </View>

        {/* Disclosure indicator */}
        <ChevronRight size={20} color={chevronColor} strokeWidth={2} />
      </Pressable>
    </View>
  );
}
