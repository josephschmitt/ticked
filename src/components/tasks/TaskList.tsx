import { View, Text, ScrollView, RefreshControl, ActivityIndicator, Pressable, useColorScheme } from "react-native";
import { AlertCircle, CheckCircle2, Inbox, ChevronRight } from "lucide-react-native";
import type { TaskGroup as TaskGroupType } from "@/types/task";
import { TaskGroup } from "./TaskGroup";
import { BRAND_COLORS, IOS_GRAYS } from "@/constants/colors";

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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Loading state
  if (isLoading && groups.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-background-grouped dark:bg-background-dark-grouped">
        <ActivityIndicator size="large" color={BRAND_COLORS.primary} />
        <Text className="mt-4 text-label-secondary dark:text-label-dark-secondary">
          Loading tasks...
        </Text>
      </View>
    );
  }

  // Error state
  if (error) {
    const iconColor = isDark ? IOS_GRAYS.gray2 : IOS_GRAYS.system;
    return (
      <View className="flex-1 items-center justify-center px-6 bg-background-grouped dark:bg-background-dark-grouped">
        <AlertCircle size={48} color={iconColor} strokeWidth={1.5} />
        <Text className="text-lg font-medium text-label-primary dark:text-label-dark-primary text-center mt-4 mb-2">
          Couldn't load tasks
        </Text>
        <Text className="text-label-secondary dark:text-label-dark-secondary text-center">
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
        className="flex-1 bg-background-grouped dark:bg-background-dark-grouped"
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 24 }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={BRAND_COLORS.primary} />
        }
      >
        <CheckCircle2 size={48} color={BRAND_COLORS.primary} strokeWidth={1.5} />
        <Text className="text-lg font-medium text-label-primary dark:text-label-dark-primary text-center mt-4 mb-2">
          All caught up!
        </Text>
        <Text className="text-label-secondary dark:text-label-dark-secondary text-center">
          You have no tasks. Pull down to refresh.
        </Text>
      </ScrollView>
    );
  }

  const chevronColor = isDark ? IOS_GRAYS.gray3 : IOS_GRAYS.gray3;

  return (
    <ScrollView
      className="flex-1 bg-background-grouped dark:bg-background-dark-grouped"
      contentContainerStyle={{ paddingTop: 16, paddingBottom: 24 }}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={BRAND_COLORS.primary} />
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
        <View className="mx-4 rounded-[10px] bg-background-elevated dark:bg-background-dark-elevated overflow-hidden">
          <Pressable
            onPress={onDonePress}
            className="flex-row items-center px-4 py-3 min-h-[44px] active:opacity-70"
          >
            <CheckCircle2 size={22} color={BRAND_COLORS.primary} strokeWidth={2} />
            <Text className="flex-1 ml-3 text-[17px] text-label-primary dark:text-label-dark-primary">
              Done
            </Text>
            {doneCount !== undefined && doneCount > 0 && (
              <Text className="text-[15px] text-label-secondary dark:text-label-dark-secondary mr-2">
                {doneCount}
              </Text>
            )}
            <ChevronRight size={20} color={chevronColor} strokeWidth={2} />
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}
