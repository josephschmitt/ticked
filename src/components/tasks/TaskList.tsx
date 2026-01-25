import { View, Text, ScrollView, RefreshControl, ActivityIndicator, Pressable } from "react-native";
import type { TaskGroup as TaskGroupType } from "@/types/task";
import { TaskGroup } from "./TaskGroup";

interface TaskListProps {
  groups: TaskGroupType[];
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  error?: Error | null;
  doneCount?: number;
  onDonePress?: () => void;
}

export function TaskList({
  groups,
  isLoading,
  isRefreshing,
  onRefresh,
  error,
  doneCount,
  onDonePress,
}: TaskListProps) {
  // Loading state
  if (isLoading && groups.length === 0) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
        <Text className="mt-4 text-gray-500 dark:text-gray-400">
          Loading tasks...
        </Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-4xl mb-4">😕</Text>
        <Text className="text-lg font-medium text-gray-900 dark:text-white text-center mb-2">
          Couldn't load tasks
        </Text>
        <Text className="text-gray-500 dark:text-gray-400 text-center">
          {error.message}
        </Text>
      </View>
    );
  }

  // Empty state
  const totalTasks = groups.reduce((acc, g) => acc + g.tasks.length, 0);
  if (totalTasks === 0) {
    return (
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 24 }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        <Text className="text-4xl mb-4">🎉</Text>
        <Text className="text-lg font-medium text-gray-900 dark:text-white text-center mb-2">
          All caught up!
        </Text>
        <Text className="text-gray-500 dark:text-gray-400 text-center">
          You have no tasks. Pull down to refresh.
        </Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ padding: 16 }}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      {groups.map((group) => (
        <TaskGroup
          key={group.status.id}
          group={group}
          defaultExpanded={group.status.group !== "complete"}
        />
      ))}

      {onDonePress && (
        <Pressable
          onPress={onDonePress}
          className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-xl flex-row items-center justify-between active:opacity-70"
        >
          <View className="flex-row items-center">
            <Text className="text-lg mr-2">✓</Text>
            <Text className="text-base font-medium text-gray-900 dark:text-white">
              Done
            </Text>
          </View>
          <View className="flex-row items-center">
            {doneCount !== undefined && doneCount > 0 && (
              <Text className="text-sm text-gray-500 dark:text-gray-400 mr-2">
                {doneCount}
              </Text>
            )}
            <Text className="text-gray-400 dark:text-gray-500">›</Text>
          </View>
        </Pressable>
      )}
    </ScrollView>
  );
}
