import { useState, useCallback } from "react";
import { View, Text, Pressable } from "react-native";
import * as Haptics from "expo-haptics";
import type { DateTaskGroup as DateTaskGroupType } from "@/types/task";
import { TaskCard } from "./TaskCard";

interface DateTaskGroupProps {
  group: DateTaskGroupType;
  defaultExpanded?: boolean;
}

export function DateTaskGroup({ group, defaultExpanded = true }: DateTaskGroupProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
    Haptics.selectionAsync();
  }, []);

  const taskCount = group.tasks.length;

  return (
    <View className="mb-4">
      {/* Header */}
      <Pressable
        onPress={toggleExpanded}
        className="flex-row items-center justify-between py-2 px-1"
      >
        <View className="flex-row items-center">
          <Text className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {group.label}
          </Text>
          <View className="ml-2 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
            <Text className="text-xs text-gray-600 dark:text-gray-300 font-medium">
              {taskCount}
            </Text>
          </View>
        </View>

        <Text className="text-gray-400 text-sm">
          {isExpanded ? "▼" : "▶"}
        </Text>
      </Pressable>

      {/* Tasks */}
      {isExpanded && (
        <View className="mt-1">
          {group.tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </View>
      )}
    </View>
  );
}
