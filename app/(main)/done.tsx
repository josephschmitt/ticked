import { useCallback } from "react";
import { View, Text, FlatList, RefreshControl, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import * as Haptics from "expo-haptics";
import { useCompletedTasks } from "@/hooks/queries/useTasks";
import { DateTaskGroup } from "@/components/tasks/DateTaskGroup";
import type { DateTaskGroup as DateTaskGroupType } from "@/types/task";

export default function DoneScreen() {
  const {
    groups,
    isLoading,
    error,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCompletedTasks();

  const handleRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await refetch();
  }, [refetch]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(({ item }: { item: DateTaskGroupType }) => (
    <DateTaskGroup group={item} defaultExpanded={true} />
  ), []);

  const renderFooter = useCallback(() => {
    if (!isFetchingNextPage) return null;
    return (
      <View className="py-4 items-center">
        <ActivityIndicator size="small" color="#6366f1" />
      </View>
    );
  }, [isFetchingNextPage]);

  // Loading state
  if (isLoading && groups.length === 0) {
    return (
      <>
        <Stack.Screen options={{ title: "Done" }} />
        <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900" edges={["bottom"]}>
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#6366f1" />
            <Text className="mt-4 text-gray-500 dark:text-gray-400">
              Loading completed tasks...
            </Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  // Error state
  if (error) {
    return (
      <>
        <Stack.Screen options={{ title: "Done" }} />
        <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900" edges={["bottom"]}>
          <View className="flex-1 items-center justify-center px-6">
            <Text className="text-4xl mb-4">😕</Text>
            <Text className="text-lg font-medium text-gray-900 dark:text-white text-center mb-2">
              Couldn't load tasks
            </Text>
            <Text className="text-gray-500 dark:text-gray-400 text-center">
              {error instanceof Error ? error.message : "Unknown error"}
            </Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  // Empty state
  const totalTasks = groups.reduce((acc, g) => acc + g.tasks.length, 0);
  if (totalTasks === 0) {
    return (
      <>
        <Stack.Screen options={{ title: "Done" }} />
        <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900" edges={["bottom"]}>
          <FlatList
            data={[]}
            renderItem={() => null}
            contentContainerStyle={{ flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 24 }}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />
            }
            ListEmptyComponent={
              <View className="items-center">
                <Text className="text-4xl mb-4">📭</Text>
                <Text className="text-lg font-medium text-gray-900 dark:text-white text-center mb-2">
                  No completed tasks yet
                </Text>
                <Text className="text-gray-500 dark:text-gray-400 text-center">
                  Completed tasks will appear here.
                </Text>
              </View>
            }
          />
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Done" }} />
      <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900" edges={["bottom"]}>
        <FlatList
          data={groups}
          keyExtractor={(item) => item.date || "unknown"}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />
          }
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
        />
      </SafeAreaView>
    </>
  );
}
