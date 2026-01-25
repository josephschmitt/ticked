import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { getTasks, getStatuses, getTasksPaginated } from "@/services/notion/operations/getTasks";
import { useAuthStore } from "@/stores/authStore";
import { useConfigStore } from "@/stores/configStore";
import type { Task, TaskStatus, TaskGroup, DateTaskGroup, StatusGroup } from "@/types/task";

export const TASKS_QUERY_KEY = ["tasks"] as const;
export const STATUSES_QUERY_KEY = ["statuses"] as const;
export const COMPLETED_TASKS_QUERY_KEY = ["completedTasks"] as const;

/**
 * Hook to fetch tasks from the configured database.
 */
export function useTasks() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const databaseId = useConfigStore((state) => state.selectedDatabaseId);
  const fieldMapping = useConfigStore((state) => state.fieldMapping);

  return useQuery({
    queryKey: [...TASKS_QUERY_KEY, databaseId],
    queryFn: () => {
      if (!databaseId || !fieldMapping) {
        throw new Error("Database not configured");
      }
      return getTasks(databaseId, fieldMapping);
    },
    enabled: isAuthenticated && !!databaseId && !!fieldMapping,
    staleTime: 1000 * 30, // 30 seconds
  });
}

/**
 * Hook to fetch status options from the configured database.
 */
export function useStatuses() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const databaseId = useConfigStore((state) => state.selectedDatabaseId);
  const fieldMapping = useConfigStore((state) => state.fieldMapping);

  return useQuery({
    queryKey: [...STATUSES_QUERY_KEY, databaseId, fieldMapping?.status],
    queryFn: () => {
      if (!databaseId || !fieldMapping?.status) {
        throw new Error("Database not configured");
      }
      return getStatuses(databaseId, fieldMapping.status);
    },
    enabled: isAuthenticated && !!databaseId && !!fieldMapping?.status,
    staleTime: 1000 * 60 * 5, // 5 minutes
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
 */
export function useGroupedTasks() {
  const tasksQuery = useTasks();
  const statusesQuery = useStatuses();

  const groups =
    tasksQuery.data && statusesQuery.data
      ? groupTasksByStatus(tasksQuery.data, statusesQuery.data)
      : [];

  return {
    groups,
    isLoading: tasksQuery.isLoading || statusesQuery.isLoading,
    error: tasksQuery.error || statusesQuery.error,
    refetch: async () => {
      await Promise.all([tasksQuery.refetch(), statusesQuery.refetch()]);
    },
    isRefetching: tasksQuery.isRefetching || statusesQuery.isRefetching,
  };
}

/**
 * Hook that provides completed tasks with infinite scroll support.
 * Tasks are grouped by completion date, descending (most recent first).
 */
export function useCompletedTasks() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const databaseId = useConfigStore((state) => state.selectedDatabaseId);
  const fieldMapping = useConfigStore((state) => state.fieldMapping);

  const query = useInfiniteQuery({
    queryKey: [...COMPLETED_TASKS_QUERY_KEY, databaseId],
    queryFn: async ({ pageParam }) => {
      if (!databaseId || !fieldMapping) {
        throw new Error("Database not configured");
      }
      return getTasksPaginated(databaseId, fieldMapping, pageParam, 50);
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
    enabled: isAuthenticated && !!databaseId && !!fieldMapping,
    staleTime: 1000 * 30,
  });

  // Flatten all pages and filter to only completed tasks, then group by date
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
