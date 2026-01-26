import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useConfigStore } from "@/stores/configStore";
import { useToastStore } from "@/stores/toastStore";
import { useMutationQueueStore } from "@/stores/mutationQueueStore";
import { useTaskCacheStore } from "@/stores/taskCacheStore";
import { useNetworkStore } from "@/stores/networkStore";
import { createTaskPage } from "@/services/notion/operations/createPage";
import {
  TASKS_QUERY_KEY,
  COMPLETED_TASKS_QUERY_KEY,
} from "@/hooks/queries/useTasks";
import type { Task, TaskStatus } from "@/types/task";

interface CreateTaskParams {
  title: string;
  status: TaskStatus;
}

/**
 * Hook to create a new task.
 * Queues mutation when offline for later sync.
 */
export function useCreateTask() {
  const queryClient = useQueryClient();
  const databaseId = useConfigStore((state) => state.selectedDatabaseId);
  const fieldMapping = useConfigStore((state) => state.fieldMapping);
  const showToast = useToastStore((state) => state.showToast);
  const addMutation = useMutationQueueStore((state) => state.addMutation);
  const addCachedTask = useTaskCacheStore((state) => state.addTask);

  return useMutation({
    mutationFn: async ({ title, status }: CreateTaskParams) => {
      if (!databaseId || !fieldMapping?.taskName || !fieldMapping?.status) {
        throw new Error("Database not configured");
      }

      // Generate a temporary ID for optimistic updates
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Create optimistic task object
      const optimisticTask: Task = {
        id: tempId,
        title,
        status,
        notionUrl: "",
        lastEditedTime: new Date().toISOString(),
        creationDate: new Date().toISOString(),
      };

      // Check if offline
      const isOffline = !useNetworkStore.getState().isConnected;

      if (isOffline) {
        // Queue the mutation for later sync
        await addMutation(tempId, "createTask", {
          title,
          statusId: status.id,
          statusName: status.name
        }, optimisticTask);
        // Update local cache
        await addCachedTask(optimisticTask);
        return { task: optimisticTask, queued: true };
      }

      // Determine if status is checkbox type
      const isCheckboxStatus = status.id === "checked" || status.id === "unchecked";

      // Create the task in Notion (databaseId is actually a dataSourceId)
      const pageId = await createTaskPage({
        dataSourceId: databaseId,
        titlePropertyId: fieldMapping.taskName,
        title,
        statusPropertyId: fieldMapping.status,
        statusName: status.name,
        isCheckboxStatus,
      });

      // Return the task with real ID
      const createdTask: Task = {
        ...optimisticTask,
        id: pageId,
        notionUrl: `https://notion.so/${pageId.replace(/-/g, "")}`,
      };

      return { task: createdTask, queued: false };
    },
    // No optimistic updates or cache manipulation - this mutation may be
    // called from cleanup and we don't want to risk corrupting the cache.
    // The new task will appear on next pull-to-refresh.
    onError: (_error) => {
      console.error("Failed to create task:", _error);
    },
  });
}
