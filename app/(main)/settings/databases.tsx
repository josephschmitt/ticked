import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Database } from "lucide-react-native";
import { useDatabases } from "@/hooks/queries/useDatabases";
import { useConfigStore } from "@/stores/configStore";
import { DatabaseCard } from "@/components/setup/DatabaseCard";
import { BRAND_COLORS, IOS_GRAYS } from "@/constants/colors";
import { isMacCatalyst } from "@/hooks/usePlatform";

export default function SettingsDatabasesScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

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
    // Navigate to field mapping within settings
    router.push("/(main)/settings/field-mapping");
  }, [selectedId, databases, setDatabase, router]);

  const iconColor = isDark ? IOS_GRAYS.gray2 : IOS_GRAYS.system;

  if (isLoading && !databases) {
    return (
      <SafeAreaView className="flex-1 bg-background-grouped dark:bg-background-dark-grouped" edges={["bottom"]}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={BRAND_COLORS.primary} />
          <Text className="mt-4 text-label-secondary dark:text-label-dark-secondary">
            Loading your databases...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-background-grouped dark:bg-background-dark-grouped" edges={["bottom"]}>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-ios-red text-lg text-center mb-4">
            Failed to load databases
          </Text>
          <Text className="text-label-secondary dark:text-label-dark-secondary text-center mb-6">
            {error instanceof Error ? error.message : "Unknown error"}
          </Text>
          <Pressable
            onPress={() => refetch()}
            className="px-6 py-3 rounded-[10px]"
            style={{ backgroundColor: BRAND_COLORS.primary }}
          >
            <Text className="text-white font-semibold text-[17px]">Try Again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!databases || databases.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-background-grouped dark:bg-background-dark-grouped" edges={["bottom"]}>
        <View className="flex-1 items-center justify-center px-6">
          <Database size={48} color={iconColor} strokeWidth={1.5} />
          <Text className="text-lg font-medium text-label-primary dark:text-label-dark-primary text-center mt-4 mb-2">
            No databases found
          </Text>
          <Text className="text-label-secondary dark:text-label-dark-secondary text-center mb-6">
            Make sure you've shared at least one database with this integration
            in Notion.
          </Text>
          <Pressable
            onPress={() => refetch()}
            className="px-6 py-3 rounded-[10px]"
            style={{ backgroundColor: BRAND_COLORS.primary }}
          >
            <Text className="text-white font-semibold text-[17px]">Refresh</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background-grouped dark:bg-background-dark-grouped" edges={["bottom"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 24 }}
        refreshControl={
          isMacCatalyst ? undefined : (
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={BRAND_COLORS.primary} />
          )
        }
      >
        <Text className="text-[15px] text-label-secondary dark:text-label-dark-secondary px-4 mb-4">
          Select a different database for your tasks.
        </Text>

        <View className="mx-4 rounded-[10px] bg-background-elevated dark:bg-background-dark-elevated overflow-hidden">
          {databases.map((database, index) => (
            <DatabaseCard
              key={database.id}
              database={database}
              isSelected={selectedId === database.id}
              onSelect={() => handleSelect(database.id)}
              isLast={index === databases.length - 1}
            />
          ))}
        </View>
      </ScrollView>

      {/* Continue button */}
      <View className="px-4 py-4 border-t border-separator dark:border-separator-dark bg-background-elevated dark:bg-background-dark-elevated">
        <Pressable
          onPress={handleContinue}
          disabled={!selectedId}
          className="py-4 rounded-[10px] items-center"
          style={{
            backgroundColor: selectedId ? BRAND_COLORS.primary : (isDark ? '#3A3A3C' : '#D1D1D6'),
          }}
        >
          <Text
            className={`text-[17px] font-semibold ${
              selectedId ? "text-white" : "text-label-tertiary dark:text-label-dark-tertiary"
            }`}
          >
            Continue
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
