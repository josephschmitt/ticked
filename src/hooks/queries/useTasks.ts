import { useQuery } from "@tanstack/react-query";
import { getTasks, getStatuses } from "@/services/notion/operations/getTasks";
import { useAuthStore } from "@/stores/authStore";
import { useConfigStore } from "@/stores/configStore";
import type { Task, TaskStatus, TaskGroup, StatusGroup } from "@/types/task";

export const TASKS_QUERY_KEY = ["tasks"] as const;
export const STATUSES_QUERY_KEY = ["statuses"] as const;

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
 * Hook that provides completed tasks grouped by status.
 */
export function useCompletedTasks() {
  const tasksQuery = useTasks();
  const statusesQuery = useStatuses();

  const groups =
    tasksQuery.data && statusesQuery.data
      ? groupCompletedTasks(tasksQuery.data, statusesQuery.data)
      : [];

  const totalCount = groups.reduce((acc, g) => acc + g.tasks.length, 0);

  return {
    groups,
    totalCount,
    isLoading: tasksQuery.isLoading || statusesQuery.isLoading,
    error: tasksQuery.error || statusesQuery.error,
    refetch: async () => {
      await Promise.all([tasksQuery.refetch(), statusesQuery.refetch()]);
    },
    isRefetching: tasksQuery.isRefetching || statusesQuery.isRefetching,
  };
}
