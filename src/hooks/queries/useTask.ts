import { useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import type { Task } from "@/types/task";
import { TASKS_QUERY_KEY, COMPLETED_TASKS_QUERY_KEY } from "./useTasks";
import { useConfigStore } from "@/stores/configStore";

interface PaginatedPage {
  tasks: Task[];
  hasMore: boolean;
  nextCursor: string | null;
}

interface InfiniteQueryData {
  pages: PaginatedPage[];
  pageParams: (string | null)[];
}

/**
 * Hook to get a single task from the query cache.
 * Avoids extra API calls by looking up the task in existing cached data.
 */
export function useTask(taskId: string | undefined): Task | undefined {
  const queryClient = useQueryClient();
  const databaseId = useConfigStore((state) => state.selectedDatabaseId);

  return useMemo(() => {
    if (!taskId || !databaseId) {
      return undefined;
    }

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
  }, [taskId, databaseId, queryClient]);
}
