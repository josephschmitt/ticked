import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useSyncExternalStore } from "react";
import type { Task } from "@/types/task";
import { TASKS_QUERY_KEY, COMPLETED_TASKS_QUERY_KEY } from "./useTasks";
import { useConfigStore } from "@/stores/configStore";
import { getTaskById } from "@/services/notion/operations/getTasks";
import { useAuthStore } from "@/stores/authStore";

interface PaginatedPage {
  tasks: Task[];
  hasMore: boolean;
  nextCursor: string | null;
}

interface InfiniteQueryData {
  pages: PaginatedPage[];
  pageParams: (string | null)[];
}

export const TASK_QUERY_KEY = ["task"] as const;

/**
 * Look up a task in the existing query caches.
 */
function findTaskInCache(
  queryClient: ReturnType<typeof useQueryClient>,
  taskId: string,
  databaseId: string
): Task | undefined {
  // First, check the main tasks cache
  const tasksData = queryClient.getQueryData<Task[]>([...TASKS_QUERY_KEY, databaseId]);
  if (tasksData) {
    const task = tasksData.find((t) => t.id === taskId);
    if (task) return task;
  }

  // Also check the completed tasks infinite query cache
  const completedData = queryClient.getQueryData<InfiniteQueryData>([
    ...COMPLETED_TASKS_QUERY_KEY,
    databaseId,
  ]);
  if (completedData?.pages) {
    for (const page of completedData.pages) {
      const task = page.tasks.find((t: Task) => t.id === taskId);
      if (task) return task;
    }
  }

  return undefined;
}

interface UseTaskResult {
  task: Task | undefined;
  isLoading: boolean;
  isError: boolean;
}

/**
 * Hook to get a single task.
 * First checks the cache, then fetches from the server if not found.
 */
export function useTask(taskId: string | undefined): UseTaskResult {
  const queryClient = useQueryClient();
  const databaseId = useConfigStore((state) => state.selectedDatabaseId);
  const fieldMapping = useConfigStore((state) => state.fieldMapping);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Subscribe to cache changes for task queries
  const cacheVersion = useSyncExternalStore(
    (callback) => {
      const unsubscribe = queryClient.getQueryCache().subscribe(callback);
      return unsubscribe;
    },
    () => queryClient.getQueryCache().find({ queryKey: [...TASKS_QUERY_KEY, databaseId] })?.state.dataUpdatedAt ?? 0,
    () => 0
  );

  // Check cache first
  const cachedTask = useMemo(() => {
    if (!taskId || !databaseId) {
      return undefined;
    }
    return findTaskInCache(queryClient, taskId, databaseId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId, databaseId, queryClient, cacheVersion]);

  // Fetch from server if not in cache
  const { data: fetchedTask, isLoading, isError } = useQuery({
    queryKey: [...TASK_QUERY_KEY, taskId],
    queryFn: async () => {
      if (!taskId || !fieldMapping) {
        return null;
      }
      return getTaskById(taskId, fieldMapping);
    },
    enabled: isAuthenticated && !!taskId && !!fieldMapping && !cachedTask,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });

  // Return cached task if available, otherwise fetched task
  return {
    task: cachedTask ?? fetchedTask ?? undefined,
    isLoading: !cachedTask && isLoading,
    isError: !cachedTask && isError,
  };
}
