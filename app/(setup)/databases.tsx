import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useDatabases } from "@/hooks/queries/useDatabases";
import { useConfigStore } from "@/stores/configStore";
import { DatabaseCard } from "@/components/setup/DatabaseCard";

export default function DatabasesScreen() {
  const router = useRouter();
  const { data: databases, isLoading, error, refetch } = useDatabases();
  const setDatabase = useConfigStore((state) => state.setDatabase);
  const currentDatabaseId = useConfigStore((state) => state.selectedDatabaseId);

  const [selectedId, setSelectedId] = useState<string | null>(
    currentDatabaseId
  );
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    Haptics.selectionAsync();
  }, []);

  const handleContinue = useCallback(async () => {
    if (!selectedId || !databases) return;

    const database = databases.find((db) => db.id === selectedId);
    if (!database) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await setDatabase(selectedId, database.title);
    router.push("/(setup)/field-mapping");
  }, [selectedId, databases, setDatabase, router]);

  if (isLoading && !databases) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-black" edges={["bottom"]}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366f1" />
          <Text className="mt-4 text-gray-600 dark:text-gray-400">
            Loading your databases...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-black" edges={["bottom"]}>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-red-600 dark:text-red-400 text-lg text-center mb-4">
            Failed to load databases
          </Text>
          <Text className="text-gray-500 dark:text-gray-400 text-center mb-6">
            {error instanceof Error ? error.message : "Unknown error"}
          </Text>
          <Pressable
            onPress={() => refetch()}
            className="bg-primary-600 px-6 py-3 rounded-xl"
          >
            <Text className="text-white font-medium">Try Again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!databases || databases.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-black" edges={["bottom"]}>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-2xl mb-4">📋</Text>
          <Text className="text-lg font-medium text-gray-900 dark:text-white text-center mb-2">
            No databases found
          </Text>
          <Text className="text-gray-500 dark:text-gray-400 text-center mb-6">
            Make sure you've shared at least one database with this integration
            in Notion.
          </Text>
          <Pressable
            onPress={() => refetch()}
            className="bg-primary-600 px-6 py-3 rounded-xl"
          >
            <Text className="text-white font-medium">Refresh</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black" edges={["bottom"]}>
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingVertical: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <Text className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Select the database you want to use for your tasks. You can change
          this later in settings.
        </Text>

        {databases.map((database) => (
          <DatabaseCard
            key={database.id}
            database={database}
            isSelected={selectedId === database.id}
            onSelect={() => handleSelect(database.id)}
          />
        ))}
      </ScrollView>

      {/* Continue button */}
      <View className="px-4 py-4 border-t border-gray-200 dark:border-gray-800">
        <Pressable
          onPress={handleContinue}
          disabled={!selectedId}
          className={`
            py-4 rounded-xl items-center
            ${selectedId ? "bg-primary-600 active:bg-primary-700" : "bg-gray-300 dark:bg-gray-700"}
          `}
        >
          <Text
            className={`text-lg font-semibold ${
              selectedId ? "text-white" : "text-gray-500 dark:text-gray-400"
            }`}
          >
            Continue
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
