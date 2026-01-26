import { useCallback, useState } from "react";
import { Pressable } from "react-native";
import { useRouter, Stack } from "expo-router";
import * as Haptics from "expo-haptics";
import { Settings } from "lucide-react-native";
import { useGroupedTasks, useCompletedTasks } from "@/hooks/queries/useTasks";
import { useConfigStore } from "@/stores/configStore";
import { TaskList } from "@/components/tasks/TaskList";
import { BRAND_COLORS } from "@/constants/colors";

export default function TaskListScreen() {
  const router = useRouter();
  const databaseName = useConfigStore((state) => state.selectedDatabaseName);
  const customListName = useConfigStore((state) => state.customListName);
  const { groups, isLoading, error, refetch } = useGroupedTasks();
  const { totalCount: doneCount } = useCompletedTasks();
  const [isUserRefreshing, setIsUserRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsUserRefreshing(true);
    await refetch();
    setIsUserRefreshing(false);
  }, [refetch]);

  const handleOpenSettings = useCallback(() => {
    Haptics.selectionAsync();
    router.push("/(main)/settings");
  }, [router]);

  const handleOpenDone = useCallback(() => {
    Haptics.selectionAsync();
    router.push("/(main)/done");
  }, [router]);

  const handleCreatePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/(main)/task/new");
  }, [router]);

  return (
    <>
      <Stack.Screen
        options={{
          title: customListName || databaseName || "Tasks",
          headerRight: () => (
            <Pressable
              onPress={handleOpenSettings}
              className="p-2"
              hitSlop={8}
            >
              <Settings size={22} color={BRAND_COLORS.primary} strokeWidth={2} />
            </Pressable>
          ),
        }}
      />
      <TaskList
        groups={groups}
        isLoading={isLoading}
        isRefreshing={isUserRefreshing}
        onRefresh={handleRefresh}
        error={error instanceof Error ? error : null}
        doneCount={doneCount}
        onDonePress={handleOpenDone}
        onCreatePress={handleCreatePress}
      />
    </>
  );
}
