import { useCallback, useState } from "react";
import { View, Text, FlatList, RefreshControl, ActivityIndicator, useColorScheme } from "react-native";
import { Stack } from "expo-router";
import * as Haptics from "expo-haptics";
import { AlertCircle, Inbox } from "lucide-react-native";
import { useCompletedTasks } from "@/hooks/queries/useTasks";
import { DateTaskGroup } from "@/components/tasks/DateTaskGroup";
import type { DateTaskGroup as DateTaskGroupType } from "@/types/task";
import { BRAND_COLORS, IOS_GRAYS } from "@/constants/colors";

export default function DoneScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [isUserRefreshing, setIsUserRefreshing] = useState(false);

  const {
    groups,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCompletedTasks();

  const handleRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsUserRefreshing(true);
    await refetch();
    setIsUserRefreshing(false);
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
        <ActivityIndicator size="small" color={BRAND_COLORS.primary} />
      </View>
    );
  }, [isFetchingNextPage]);

  const iconColor = isDark ? IOS_GRAYS.gray2 : IOS_GRAYS.system;

  // Loading state
  if (isLoading && groups.length === 0) {
    return (
      <>
        <Stack.Screen options={{ title: "Done" }} />
        <View className="flex-1 items-center justify-center bg-background-grouped dark:bg-background-dark-grouped">
          <ActivityIndicator size="large" color={BRAND_COLORS.primary} />
          <Text className="mt-4 text-label-secondary dark:text-label-dark-secondary">
            Loading completed tasks...
          </Text>
        </View>
      </>
    );
  }

  // Error state
  if (error) {
    return (
      <>
        <Stack.Screen options={{ title: "Done" }} />
        <View className="flex-1 items-center justify-center px-6 bg-background-grouped dark:bg-background-dark-grouped">
          <AlertCircle size={48} color={iconColor} strokeWidth={1.5} />
          <Text className="text-lg font-medium text-label-primary dark:text-label-dark-primary text-center mt-4 mb-2">
            Couldn't load tasks
          </Text>
          <Text className="text-label-secondary dark:text-label-dark-secondary text-center">
            {error instanceof Error ? error.message : "Unknown error"}
          </Text>
        </View>
      </>
    );
  }

  // Empty state
  const totalTasks = groups.reduce((acc, g) => acc + g.tasks.length, 0);
  if (totalTasks === 0) {
    return (
      <>
        <Stack.Screen options={{ title: "Done" }} />
        <FlatList
          data={[]}
          renderItem={() => null}
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 24, paddingBottom: 40 }}
          contentInsetAdjustmentBehavior="automatic"
          refreshControl={
            <RefreshControl refreshing={isUserRefreshing} onRefresh={handleRefresh} tintColor={BRAND_COLORS.primary} />
          }
          ListEmptyComponent={
            <View className="items-center">
              <Inbox size={48} color={iconColor} strokeWidth={1.5} />
              <Text className="text-lg font-medium text-label-primary dark:text-label-dark-primary text-center mt-4 mb-2">
                No completed tasks yet
              </Text>
              <Text className="text-label-secondary dark:text-label-dark-secondary text-center">
                Completed tasks will appear here.
              </Text>
            </View>
          }
        />
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Done" }} />
      <FlatList
        data={groups}
        keyExtractor={(item) => item.date || "unknown"}
        renderItem={renderItem}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl refreshing={isUserRefreshing} onRefresh={handleRefresh} tintColor={BRAND_COLORS.primary} />
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
      />
    </>
  );
}
