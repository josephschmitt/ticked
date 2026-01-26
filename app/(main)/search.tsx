import { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  useColorScheme,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { Search } from "lucide-react-native";
import { useSearchStore } from "@/stores/searchStore";
import { useTaskCacheStore } from "@/stores/taskCacheStore";
import { searchTasksLocal } from "@/services/search/searchService";
import { groupTasksByStatus } from "@/hooks/queries/useTasks";
import { TaskGroup } from "@/components/tasks/TaskGroup";
import { IOS_GRAYS, IOS_BACKGROUNDS } from "@/constants/colors";

export default function SearchScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();

  // Search state from global store
  const query = useSearchStore((state) => state.query);

  // Cache state
  const cachedTasks = useTaskCacheStore((state) => state.tasks);
  const cachedStatuses = useTaskCacheStore((state) => state.statuses);

  // Local search (synchronous)
  const filteredTasks = useMemo(
    () => (query.length >= 2 ? searchTasksLocal(cachedTasks, query) : []),
    [cachedTasks, query]
  );

  // Group filtered results by status
  const groups = useMemo(
    () => (filteredTasks.length > 0 && cachedStatuses.length > 0
      ? groupTasksByStatus(filteredTasks, cachedStatuses)
      : []),
    [filteredTasks, cachedStatuses]
  );

  // Colors
  const bgColor = isDark ? IOS_BACKGROUNDS.grouped.dark : IOS_BACKGROUNDS.grouped.light;
  const textColor = isDark ? "#FFFFFF" : "#000000";
  const placeholderColor = isDark ? IOS_GRAYS.gray2 : IOS_GRAYS.system;

  // State flags
  const isSearching = query.length >= 2;
  const showNoResults = isSearching && filteredTasks.length === 0;
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
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 16 },
            (showNoResults || showPrompt) && styles.scrollContentCentered,
          ]}
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="never"
        >
          {/* Prompt to search */}
          {showPrompt && (
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
          {showNoResults && (
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
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
