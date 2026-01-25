import { View, Text, Pressable, Linking } from "react-native";
import * as Haptics from "expo-haptics";
import type { Task } from "@/types/task";
import { STATUS_COLORS } from "@/types/task";

interface TaskCardProps {
  task: Task;
  onPress?: () => void;
}

export function TaskCard({ task, onPress }: TaskCardProps) {
  const colorClass = STATUS_COLORS[task.status.color] || STATUS_COLORS.default;

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

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={handleLongPress}
      className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-2 border border-gray-100 dark:border-gray-700 active:opacity-80"
    >
      <View className="flex-row items-start">
        {/* Status indicator */}
        <View
          className={`w-3 h-3 rounded-full mt-1.5 mr-3 ${colorClass}`}
        />

        {/* Content */}
        <View className="flex-1">
          <Text
            className="text-base font-medium text-gray-900 dark:text-white leading-tight"
            numberOfLines={2}
          >
            {task.title}
          </Text>

          {/* Meta row */}
          <View className="flex-row flex-wrap items-center mt-2 gap-2">
            {task.project && (
              <View className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                <Text className="text-xs text-gray-600 dark:text-gray-300">
                  {task.project}
                </Text>
              </View>
            )}

            {task.taskType && (
              <View className="bg-primary-100 dark:bg-primary-900/30 px-2 py-0.5 rounded">
                <Text className="text-xs text-primary-700 dark:text-primary-300">
                  {task.taskType}
                </Text>
              </View>
            )}

            {displayDate && (
              <Text className="text-xs text-gray-500 dark:text-gray-400">
                {displayDate}
              </Text>
            )}

            {task.url && (
              <Text className="text-xs text-blue-500">🔗</Text>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
}
