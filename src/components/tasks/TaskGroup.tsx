import { useState, useCallback } from "react";
import { View, Text, Pressable } from "react-native";
import * as Haptics from "expo-haptics";
import type { TaskGroup as TaskGroupType } from "@/types/task";
import { TaskCard } from "./TaskCard";
import { STATUS_GROUP_COLORS } from "@/constants/colors";

interface TaskGroupProps {
  group: TaskGroupType;
  defaultExpanded?: boolean;
}

export function TaskGroup({ group, defaultExpanded = true }: TaskGroupProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
    Haptics.selectionAsync();
  }, []);

  const groupColors = STATUS_GROUP_COLORS[group.status.group];
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
            {group.status.name}
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
          {group.tasks.length === 0 ? (
            <View className="py-4 items-center">
              <Text className="text-gray-400 dark:text-gray-500 text-sm">
                No tasks
              </Text>
            </View>
          ) : (
            group.tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))
          )}
        </View>
      )}
    </View>
  );
}
