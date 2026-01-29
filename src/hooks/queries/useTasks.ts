import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { getTasks, getStatuses, getTasksPaginated } from "@/services/notion/operations/getTasks";
import { useAuthStore } from "@/stores/authStore";
import { useConfigStore } from "@/stores/configStore";
import { useTaskCacheStore } from "@/stores/taskCacheStore";
import { useNetworkState } from "@/hooks/useNetworkState";
import type { Task, TaskStatus, TaskGroup, DateTaskGroup, StatusGroup } from "@/types/task";

export const TASKS_QUERY_KEY = ["tasks"] as const;
export const STATUSES_QUERY_KEY = ["statuses"] as const;
export const COMPLETED_TASKS_QUERY_KEY = ["completedTasks"] as const;

/**
 * Hook to fetch active (non-completed) tasks from the configured database.
 * Uses cached tasks as placeholder data for instant display.
 * Filters out completed tasks at the API level for better performance.
 */
export function useTasks() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const databaseId = useConfigStore((state) => state.selectedDatabaseId);
  const fieldMapping = useConfigStore((state) => state.fieldMapping);

  // Cache integration
  const cachedTasks = useTaskCacheStore((state) => state.tasks);
  const setTasks = useTaskCacheStore((state) => state.setTasks);
  const setLastSyncedAt = useTaskCacheStore((state) => state.setLastSyncedAt);

  // Network state
  const { isOffline } = useNetworkState();

  return useQuery({
    queryKey: [...TASKS_QUERY_KEY, databaseId, 'active'],
    queryFn: async () => {
      if (!databaseId || !fieldMapping) {
        throw new Error("Database not configured");
      }
      // Only fetch active (non-completed) tasks
      const tasks = await getTasks(databaseId, fieldMapping, 'active');

      // Update cache after successful fetch
      await setTasks(tasks);
      await setLastSyncedAt(new Date().toISOString());

      return tasks;
    },
    enabled: isAuthenticated && !!databaseId && !!fieldMapping && !isOffline,
    staleTime: 1000 * 30, // 30 seconds
    // Use cached tasks as placeholder for instant display
    placeholderData: cachedTasks.length > 0 ? cachedTasks : undefined,
  });
}

/**
 * Hook to fetch status options from the configured database.
 * Uses cached statuses as placeholder data for instant display.
 */
export function useStatuses() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const databaseId = useConfigStore((state) => state.selectedDatabaseId);
  const fieldMapping = useConfigStore((state) => state.fieldMapping);

  // Cache integration
  const cachedStatuses = useTaskCacheStore((state) => state.statuses);
  const setStatuses = useTaskCacheStore((state) => state.setStatuses);

  // Network state
  const { isOffline } = useNetworkState();

  return useQuery({
    queryKey: [...STATUSES_QUERY_KEY, databaseId, fieldMapping?.status],
    queryFn: async () => {
      if (!databaseId || !fieldMapping?.status) {
        throw new Error("Database not configured");
      }
      const statuses = await getStatuses(databaseId, fieldMapping.status);

      // Update cache after successful fetch
      await setStatuses(statuses);

      return statuses;
    },
    enabled: isAuthenticated && !!databaseId && !!fieldMapping?.status && !isOffline,
    staleTime: 1000 * 60 * 5, // 5 minutes
    // Use cached statuses as placeholder for instant display
    placeholderData: cachedStatuses.length > 0 ? cachedStatuses : undefined,
  });
}

/**
 * Group tasks by status for display.
 * Excludes "complete" status groups - those are shown on a separate Done page.
 * Reverses the order from Notion to show active statuses first.
 */
export function groupTasksByStatus(
  tasks: Task[],
  statuses: TaskStatus[]
): TaskGroup[] {
  const groups: TaskGroup[] = [];

  for (const status of statuses) {
    // Skip complete statuses - they'll be shown on the Done page
    if (status.group === "complete") continue;

    const tasksForStatus = tasks.filter((t) => t.status.id === status.id);
    groups.push({
      status,
      tasks: tasksForStatus,
    });
  }

  return groups.reverse();
}

/**
 * Group completed tasks by status for the Done page.
 */
export function groupCompletedTasks(
  tasks: Task[],
  statuses: TaskStatus[]
): TaskGroup[] {
  const groups: TaskGroup[] = [];

  for (const status of statuses) {
    // Only include complete statuses
    if (status.group !== "complete") continue;

    const tasksForStatus = tasks.filter((t) => t.status.id === status.id);
    if (tasksForStatus.length > 0) {
      groups.push({
        status,
        tasks: tasksForStatus,
      });
    }
  }

  return groups;
}

/**
 * Format a date string into a human-readable label.
 */
function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const taskDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (taskDate.getTime() === today.getTime()) {
    return "Today";
  }
  if (taskDate.getTime() === yesterday.getTime()) {
    return "Yesterday";
  }

  // Format as "January 24, 2026"
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Group completed tasks by completion date, descending (most recent first).
 */
export function groupTasksByCompletionDate(tasks: Task[]): DateTaskGroup[] {
  // Filter to only completed tasks and those with a completion date
  const completedTasks = tasks.filter(
    (t) => t.status.group === "complete" && t.completedDate
  );

  // Group by date (YYYY-MM-DD)
  const groupMap = new Map<string, Task[]>();
  for (const task of completedTasks) {
    const dateKey = task.completedDate!.split("T")[0]; // Get just the date part
    const existing = groupMap.get(dateKey) || [];
    existing.push(task);
    groupMap.set(dateKey, existing);
  }

  // Convert to array and sort by date descending
  const groups: DateTaskGroup[] = Array.from(groupMap.entries())
    .sort(([a], [b]) => b.localeCompare(a)) // Descending
    .map(([dateKey, tasks]) => ({
      label: formatDateLabel(dateKey),
      date: dateKey,
      tasks,
    }));

  // Add tasks without completion date as "Unknown" group at the end
  const unknownDateTasks = tasks.filter(
    (t) => t.status.group === "complete" && !t.completedDate
  );
  if (unknownDateTasks.length > 0) {
    groups.push({
      label: "Unknown",
      date: "",
      tasks: unknownDateTasks,
    });
  }

  return groups;
}

/**
 * Hook that provides tasks grouped by status.
 * Falls back to cached data when offline.
 */
export function useGroupedTasks() {
  const tasksQuery = useTasks();
  const statusesQuery = useStatuses();
  const { isOffline } = useNetworkState();

  // Get cached data for offline use
  const cachedTasks = useTaskCacheStore((state) => state.tasks);
  const cachedStatuses = useTaskCacheStore((state) => state.statuses);
  const lastSyncedAt = useTaskCacheStore((state) => state.lastSyncedAt);

  // Use query data if available, fall back to cache when offline
  const tasks = tasksQuery.data ?? (isOffline ? cachedTasks : []);
  const statuses = statusesQuery.data ?? (isOffline ? cachedStatuses : []);

  const groups =
    tasks.length > 0 && statuses.length > 0
      ? groupTasksByStatus(tasks, statuses)
      : [];

  return {
    groups,
    isLoading: !isOffline && (tasksQuery.isLoading || statusesQuery.isLoading),
    error: tasksQuery.error || statusesQuery.error,
    refetch: async () => {
      await Promise.all([tasksQuery.refetch(), statusesQuery.refetch()]);
    },
    isRefetching: tasksQuery.isRefetching || statusesQuery.isRefetching,
    isOffline,
    lastSyncedAt,
  };
}

/**
 * Hook that provides completed tasks with infinite scroll support.
 * Tasks are grouped by completion date, descending (most recent first).
 * Filters to only completed tasks at the API level for better performance.
 */
export function useCompletedTasks() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const databaseId = useConfigStore((state) => state.selectedDatabaseId);
  const fieldMapping = useConfigStore((state) => state.fieldMapping);

  const query = useInfiniteQuery({
    queryKey: [...COMPLETED_TASKS_QUERY_KEY, databaseId, 'completed'],
    queryFn: async ({ pageParam }) => {
      if (!databaseId || !fieldMapping) {
        throw new Error("Database not configured");
      }
      // Only fetch completed tasks
      return getTasksPaginated(databaseId, fieldMapping, pageParam, 50, 'completed');
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
    enabled: isAuthenticated && !!databaseId && !!fieldMapping,
    staleTime: 1000 * 30,
  });

  // Flatten all pages and group by date (no client-side status filtering needed)
  const allTasks = query.data?.pages.flatMap((page) => page.tasks) ?? [];
  const groups = groupTasksByCompletionDate(allTasks);
  const totalCount = groups.reduce((acc, g) => acc + g.tasks.length, 0);

  return {
    groups,
    totalCount,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    isRefetching: query.isRefetching,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
  };
}
