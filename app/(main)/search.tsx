import { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  useColorScheme,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
  Platform,
  KeyboardEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { Search } from "lucide-react-native";
import { useSearchStore } from "@/stores/searchStore";
import { useTaskCacheStore } from "@/stores/taskCacheStore";
import { searchTasksLocal } from "@/services/search/searchService";
import { useSearchTasks } from "@/hooks/queries/useSearchTasks";
import { useNetworkState } from "@/hooks/useNetworkState";
import { groupTasksByStatus } from "@/hooks/queries/useTasks";
import { TaskGroup } from "@/components/tasks/TaskGroup";
import { SearchModeToggle } from "@/components/search/SearchModeToggle";
import { IOS_GRAYS, IOS_BACKGROUNDS, BRAND_COLORS } from "@/constants/colors";

export default function SearchScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const { isOffline } = useNetworkState();
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Track keyboard height
  useEffect(() => {
    const showListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (event: KeyboardEvent) => {
        setKeyboardHeight(event.endCoordinates.height);
      }
    );
    const hideListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  // Search state from global store
  const query = useSearchStore((state) => state.query);
  const mode = useSearchStore((state) => state.mode);
  const setMode = useSearchStore((state) => state.setMode);

  // Cache state
  const cachedTasks = useTaskCacheStore((state) => state.tasks);
  const cachedStatuses = useTaskCacheStore((state) => state.statuses);
  const lastSyncedAt = useTaskCacheStore((state) => state.lastSyncedAt);

  // Online search via TanStack Query
  const { data: onlineResults, isLoading: isOnlineLoading } = useSearchTasks(query, mode);

  // Local search (synchronous)
  const localResults = useMemo(
    () => (query.length >= 2 ? searchTasksLocal(cachedTasks, query) : []),
    [cachedTasks, query]
  );

  // Use results based on mode
  const filteredTasks = mode === "online" ? (onlineResults ?? []) : localResults;

  // Group filtered results by status
  const groups = useMemo(
    () => (filteredTasks.length > 0 && cachedStatuses.length > 0
      ? groupTasksByStatus(filteredTasks, cachedStatuses)
      : []),
    [filteredTasks, cachedStatuses]
  );

  // Format last synced time
  const lastSyncedText = useMemo(() => {
    if (!lastSyncedAt) return undefined;
    const syncTime = new Date(lastSyncedAt).getTime();
    const diff = Date.now() - syncTime;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Last synced: just now";
    if (minutes < 60) return `Last synced: ${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Last synced: ${hours}h ago`;
    return `Last synced: ${Math.floor(hours / 24)}d ago`;
  }, [lastSyncedAt]);

  // Colors
  const bgColor = isDark ? IOS_BACKGROUNDS.grouped.dark : IOS_BACKGROUNDS.grouped.light;
  const textColor = isDark ? "#FFFFFF" : "#000000";
  const placeholderColor = isDark ? IOS_GRAYS.gray2 : IOS_GRAYS.system;

  // State flags
  const isSearching = query.length >= 2;
  const isLoading = mode === "online" && isOnlineLoading && isSearching;
  const showNoResults = isSearching && !isLoading && filteredTasks.length === 0;
  const showPrompt = !isSearching;
  const totalTasks = groups.reduce((acc, g) => acc + g.tasks.length, 0);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          animation: "fade",
        }}
      />

      <View style={[styles.container, { backgroundColor: bgColor }]}>
        {/* Mode toggle at top */}
        <View style={[styles.toggleWrapper, { paddingTop: insets.top + 8 }]}>
          <SearchModeToggle
            mode={mode}
            onModeChange={setMode}
            disabled={isOffline}
            subtitle={mode === "local" ? lastSyncedText : undefined}
          />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            (showNoResults || showPrompt || isLoading) && styles.scrollContentCentered,
            keyboardHeight > 0 && { paddingBottom: keyboardHeight + 60 },
          ]}
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="never"
        >
          {/* Loading state for online search */}
          {isLoading && (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color={BRAND_COLORS.primary} />
              <Text style={[styles.emptySubtitle, { color: placeholderColor, marginTop: 16 }]}>
                Searching Notion...
              </Text>
            </View>
          )}

          {/* Prompt to search */}
          {showPrompt && !isLoading && (
            <View style={styles.emptyState}>
              <Search size={48} color={placeholderColor} strokeWidth={1.5} />
              <Text style={[styles.emptyTitle, { color: textColor }]}>
                Search Tasks
              </Text>
              <Text style={[styles.emptySubtitle, { color: placeholderColor }]}>
                Type at least 2 characters to search
              </Text>
            </View>
          )}

          {/* No results */}
          {showNoResults && !isLoading && (
            <View style={styles.emptyState}>
              <Search size={48} color={placeholderColor} strokeWidth={1.5} />
              <Text style={[styles.emptyTitle, { color: textColor }]}>
                No Results
              </Text>
              <Text style={[styles.emptySubtitle, { color: placeholderColor }]}>
                No tasks match "{query}"
              </Text>
            </View>
          )}

          {/* Task groups - same as main TaskList */}
          {totalTasks > 0 && groups.map((group) => (
            <TaskGroup
              key={group.status.id}
              group={group}
              defaultExpanded={true}
            />
          ))}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toggleWrapper: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(128, 128, 128, 0.2)",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
    paddingTop: 16,
  },
  scrollContentCentered: {
    flexGrow: 1,
    justifyContent: "center",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 15,
    marginTop: 8,
    textAlign: "center",
  },
});
