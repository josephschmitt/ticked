import { useCallback } from "react";
import { View, Text, FlatList, useColorScheme, Pressable } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, AlertTriangle } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useMutationQueueStore } from "@/stores/mutationQueueStore";
import { useConfigStore } from "@/stores/configStore";
import { applyLocalChanges } from "@/services/sync/syncManager";
import { ConflictCard } from "@/components/sync/ConflictCard";
import { TASKS_QUERY_KEY, COMPLETED_TASKS_QUERY_KEY } from "@/hooks/queries/useTasks";
import { BRAND_COLORS, IOS_GRAYS, IOS_BACKGROUNDS } from "@/constants/colors";
import type { SyncConflict, ConflictResolution } from "@/types/mutation";

export default function ConflictsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const conflicts = useMutationQueueStore((state) => state.conflicts);
  const resolveConflict = useMutationQueueStore((state) => state.resolveConflict);
  const databaseId = useConfigStore((state) => state.selectedDatabaseId);

  const handleResolve = useCallback(
    async (conflictId: string, resolution: ConflictResolution) => {
      const conflict = conflicts.find((c) => c.id === conflictId);
      if (!conflict) return;

      if (resolution === "keepLocal") {
        // Apply local changes to server
        const success = await applyLocalChanges(conflict.mutation);
        if (!success) {
          // TODO: Show error toast
          return;
        }
      }

      // Mark conflict as resolved
      await resolveConflict(conflictId, resolution);

      // Refetch tasks to get latest state
      if (databaseId) {
        queryClient.invalidateQueries({ queryKey: [...TASKS_QUERY_KEY, databaseId] });
        queryClient.invalidateQueries({ queryKey: [...COMPLETED_TASKS_QUERY_KEY, databaseId] });
      }

      // If no more conflicts, go back
      const remainingConflicts = conflicts.filter((c) => c.id !== conflictId);
      if (remainingConflicts.length === 0) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.back();
      }
    },
    [conflicts, resolveConflict, databaseId, queryClient, router]
  );

  const renderItem = useCallback(
    ({ item }: { item: SyncConflict }) => (
      <ConflictCard conflict={item} onResolve={handleResolve} />
    ),
    [handleResolve]
  );

  const iconColor = isDark ? IOS_GRAYS.gray4 : IOS_GRAYS.gray2;
  const textColor = isDark ? IOS_GRAYS.gray5 : IOS_GRAYS.system;
  const secondaryColor = isDark ? IOS_GRAYS.gray4 : IOS_GRAYS.gray2;

  // Empty state (all conflicts resolved)
  if (conflicts.length === 0) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Sync Conflicts",
            headerShown: true,
            presentation: "modal",
          }}
        />
        <View className="flex-1 items-center justify-center px-6 bg-background-grouped dark:bg-background-dark-grouped">
          <CheckCircle2 size={48} color={BRAND_COLORS.primary} strokeWidth={1.5} />
          <Text
            className="text-lg font-medium text-center mt-4 mb-2"
            style={{ color: textColor }}
          >
            All synced
          </Text>
          <Text
            className="text-center"
            style={{ color: secondaryColor }}
          >
            No conflicts to resolve.
          </Text>
          <Pressable
            onPress={() => router.back()}
            className="mt-6 px-6 py-3 rounded-xl"
            style={{ backgroundColor: BRAND_COLORS.primary }}
          >
            <Text className="text-white font-semibold text-[15px]">Done</Text>
          </Pressable>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Sync Conflicts",
          headerShown: true,
          presentation: "modal",
        }}
      />
      <FlatList
        data={conflicts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
        contentInsetAdjustmentBehavior="automatic"
        ListHeaderComponent={
          <View className="px-4 pb-4">
            <View className="flex-row items-center mb-2">
              <AlertTriangle size={20} color="#FF9500" strokeWidth={2} />
              <Text
                className="text-[17px] font-semibold ml-2"
                style={{ color: textColor }}
              >
                {conflicts.length} conflict{conflicts.length > 1 ? "s" : ""} found
              </Text>
            </View>
            <Text
              className="text-[14px] leading-5"
              style={{ color: secondaryColor }}
            >
              These tasks were modified both locally and on the server while you were
              offline. Choose which version to keep for each conflict.
            </Text>
          </View>
        }
      />
    </>
  );
}
