import { useCallback } from "react";
import { View, Pressable, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, Stack } from "expo-router";
import * as Haptics from "expo-haptics";
import { useGroupedTasks } from "@/hooks/queries/useTasks";
import { useConfigStore } from "@/stores/configStore";
import { TaskList } from "@/components/tasks/TaskList";

export default function TaskListScreen() {
  const router = useRouter();
  const databaseName = useConfigStore((state) => state.selectedDatabaseName);
  const { groups, isLoading, error, refetch, isRefetching } = useGroupedTasks();

  const handleRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await refetch();
  }, [refetch]);

  const handleOpenSettings = useCallback(() => {
    Haptics.selectionAsync();
    router.push("/(main)/settings");
  }, [router]);

  return (
    <>
      <Stack.Screen
        options={{
          title: databaseName || "Tasks",
          headerRight: () => (
            <Pressable
              onPress={handleOpenSettings}
              className="p-2"
              hitSlop={8}
            >
              <Text className="text-2xl">⚙️</Text>
            </Pressable>
          ),
        }}
      />
      <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900" edges={["bottom"]}>
        <TaskList
          groups={groups}
          isLoading={isLoading}
          isRefreshing={isRefetching}
          onRefresh={handleRefresh}
          error={error instanceof Error ? error : null}
        />
      </SafeAreaView>
    </>
  );
}
