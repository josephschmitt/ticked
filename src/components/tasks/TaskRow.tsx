import { View, Text, Pressable, Linking, useColorScheme } from "react-native";
import * as Haptics from "expo-haptics";
import { Circle, CheckCircle2, Link, FolderOpen, Tag } from "lucide-react-native";
import { router } from "expo-router";
import type { Task } from "@/types/task";
import { DateBadge, formatDisplayDate } from "@/components/ui/DateBadge";
import { RelationBadge } from "@/components/ui/RelationBadge";
import { useConfigStore } from "@/stores/configStore";
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
  const showTaskTypeInline = useConfigStore((state) => state.showTaskTypeInline);

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

  const isComplete = task.status.group === "complete";

  // Check if we have metadata to display
  const hasMetadata = task.project || task.doDate || task.dueDate || task.url;

  // Build accessibility label
  const accessibilityParts = [task.title, `Status: ${task.status.name}`];
  if (task.project) accessibilityParts.push(`Project: ${task.project}`);
  if (task.taskType) accessibilityParts.push(`Type: ${task.taskType}`);
  if (task.doDate) accessibilityParts.push(`Do: ${formatDisplayDate(task.doDate)}`);
  if (task.dueDate) accessibilityParts.push(`Due: ${formatDisplayDate(task.dueDate)}`);
  if (task.url) accessibilityParts.push(`Link: ${task.url}`);
  const accessibilityLabel = accessibilityParts.join(". ");

  const checkboxColor = isComplete ? BRAND_COLORS.primary : (isDark ? IOS_GRAYS.gray3 : IOS_GRAYS.gray3);
  const linkColor = isDark ? IOS_GRAYS.gray2 : IOS_GRAYS.system;

  return (
    <View
      className="flex-row items-start"
      accessible={true}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
    >
      {/* Checkbox column - includes checkbox and optional task type icon */}
      <Pressable
        onPress={handleCheckboxPress}
        className="flex-row pl-6 pt-3 pb-3 pr-2 min-h-[44px] items-center gap-2"
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
        {showTaskTypeInline && task.taskType && task.taskTypeIcon && (
          <View className="h-6 items-center justify-center">
            <RelationBadge icon={task.taskTypeIcon} fallbackIcon={Tag} size="large" />
          </View>
        )}
      </Pressable>

      {/* Content - opens task detail */}
      <Pressable
        onPress={handleContentPress}
        onLongPress={handleLongPress}
        className="flex-1 flex-row items-start py-3 pr-6 min-h-[44px] active:opacity-70"
        accessibilityHint="Tap to view details, long press to open in Notion"
      >
        <View className="flex-1">
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
            <View className={`flex-row items-center mt-0.5 gap-1.5 ${isComplete ? 'opacity-60' : ''}`} accessible={false}>
              {/* Left: Project */}
              {task.project && (
                <RelationBadge
                  name={task.project}
                  icon={task.projectIcon}
                  fallbackIcon={FolderOpen}
                  size="small"
                />
              )}

              {/* Middle: URL (flexible, clips with ellipsis) */}
              {task.url && (
                <View className="flex-row items-center flex-1 min-w-0">
                  <Link
                    size={12}
                    color={linkColor}
                    strokeWidth={2}
                    style={{ flexShrink: 0 }}
                  />
                  <Text
                    className="text-[15px] text-label-secondary dark:text-label-dark-secondary ml-1 flex-shrink"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {task.url}
                  </Text>
                </View>
              )}

              {/* Right: Dates */}
              {(task.doDate || task.dueDate) && (
                <View className="flex-row items-center flex-shrink-0 ml-auto gap-2">
                  {task.doDate && (
                    <DateBadge date={task.doDate} type="do" isComplete={isComplete} size="small" />
                  )}
                  {task.dueDate && (
                    <DateBadge date={task.dueDate} type="due" isComplete={isComplete} size="small" />
                  )}
                </View>
              )}
            </View>
          )}
        </View>
      </Pressable>
    </View>
  );
}
