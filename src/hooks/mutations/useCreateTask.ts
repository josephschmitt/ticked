import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useConfigStore } from "@/stores/configStore";
import { useToastStore } from "@/stores/toastStore";
import { useMutationQueueStore } from "@/stores/mutationQueueStore";
import { useTaskCacheStore } from "@/stores/taskCacheStore";
import { useNetworkStore } from "@/stores/networkStore";
import { createTaskPage } from "@/services/notion/operations/createPage";
import { TASKS_QUERY_KEY } from "@/hooks/queries/useTasks";
import type { Task, TaskStatus } from "@/types/task";
import type { DatabaseIcon } from "@/types/database";

export type TaskTypeValue =
  | { type: "select"; name: string }
  | { type: "relation"; pageId: string; displayName: string };

export type ProjectValue =
  | { type: "select"; name: string }
  | { type: "relation"; pageId: string; displayName: string };

export interface CreateTaskParams {
  title: string;
  status: TaskStatus;
  doDate?: string;
  dueDate?: string;
  taskType?: TaskTypeValue;
  taskTypeIcon?: DatabaseIcon | null;
  project?: ProjectValue;
  projectIcon?: DatabaseIcon | null;
  url?: string;
}

/**
 * Helper to add a task to the query cache.
 * New tasks always go to the active list (with "active" suffix).
 */
function addTaskToCache(
  queryClient: ReturnType<typeof useQueryClient>,
  databaseId: string | null,
  task: Task
) {
  // Add to active tasks cache at the beginning (note the "active" suffix)
  queryClient.setQueryData<Task[]>(
    [...TASKS_QUERY_KEY, databaseId, "active"],
    (oldTasks) => {
      if (!oldTasks) return [task];
      return [task, ...oldTasks];
    }
  );
}

/**
 * Helper to replace a temp task ID with the real ID in the cache.
 */
function replaceTaskIdInCache(
  queryClient: ReturnType<typeof useQueryClient>,
  databaseId: string | null,
  tempId: string,
  realTask: Task
) {
  queryClient.setQueryData<Task[]>(
    [...TASKS_QUERY_KEY, databaseId, "active"],
    (oldTasks) => {
      if (!oldTasks) return oldTasks;
      return oldTasks.map((t) => (t.id === tempId ? realTask : t));
    }
  );
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
    mutationFn: async (params: CreateTaskParams) => {
      const { title, status, doDate, dueDate, taskType, taskTypeIcon, project, projectIcon, url } = params;

      if (!databaseId || !fieldMapping?.taskName || !fieldMapping?.status) {
        throw new Error("Database not configured");
      }

      // Check if offline - if so, just return early (optimistic update already done in onMutate)
      // The mutation will be queued in onMutate when offline
      const isOffline = !useNetworkStore.getState().isConnected;
      if (isOffline) {
        // Return a placeholder - the real task is already in cache from onMutate
        return { task: null, queued: true };
      }

      // Determine if status is checkbox type
      const isCheckboxStatus = status.id === "checked" || status.id === "unchecked";

      // Build optional field options for createTaskPage
      const doDateOption = doDate && fieldMapping.doDate
        ? { propertyId: fieldMapping.doDate, date: doDate }
        : undefined;

      const dueDateOption = dueDate && fieldMapping.dueDate
        ? { propertyId: fieldMapping.dueDate, date: dueDate }
        : undefined;

      const taskTypeOption = taskType && fieldMapping.taskType
        ? taskType.type === "select"
          ? { propertyId: fieldMapping.taskType, type: "select" as const, value: taskType.name }
          : { propertyId: fieldMapping.taskType, type: "relation" as const, value: [taskType.pageId] }
        : undefined;

      const projectOption = project && fieldMapping.project
        ? project.type === "select"
          ? { propertyId: fieldMapping.project, type: "select" as const, value: project.name }
          : { propertyId: fieldMapping.project, type: "relation" as const, value: [project.pageId] }
        : undefined;

      const urlOption = url && fieldMapping.url
        ? { propertyId: fieldMapping.url, url }
        : undefined;

      // Create the task in Notion (databaseId is actually a dataSourceId)
      const pageId = await createTaskPage({
        dataSourceId: databaseId,
        titlePropertyId: fieldMapping.taskName,
        title,
        statusPropertyId: fieldMapping.status,
        statusName: status.name,
        isCheckboxStatus,
        doDate: doDateOption,
        dueDate: dueDateOption,
        taskType: taskTypeOption,
        project: projectOption,
        url: urlOption,
      });

      // Return the created task with real ID
      const createdTask: Task = {
        id: pageId,
        title,
        status,
        doDate,
        dueDate,
        taskType: taskType
          ? taskType.type === "select" ? taskType.name : taskType.displayName
          : undefined,
        taskTypeIcon: taskTypeIcon ?? undefined,
        project: project
          ? project.type === "select" ? project.name : project.displayName
          : undefined,
        projectIcon: projectIcon ?? undefined,
        url,
        notionUrl: `https://notion.so/${pageId.replace(/-/g, "")}`,
        lastEditedTime: new Date().toISOString(),
        creationDate: new Date().toISOString(),
      };

      return { task: createdTask, queued: false };
    },
    onMutate: async (params: CreateTaskParams) => {
      const { title, status, doDate, dueDate, taskType, taskTypeIcon, project, projectIcon, url } = params;

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: [...TASKS_QUERY_KEY, databaseId, "active"] });

      // Snapshot previous value for rollback
      const previousTasks = queryClient.getQueryData<Task[]>([...TASKS_QUERY_KEY, databaseId, "active"]);

      // Generate temp ID for optimistic update
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Create optimistic task with all fields
      const optimisticTask: Task = {
        id: tempId,
        title,
        status,
        doDate,
        dueDate,
        taskType: taskType
          ? taskType.type === "select" ? taskType.name : taskType.displayName
          : undefined,
        taskTypeIcon: taskTypeIcon ?? undefined,
        project: project
          ? project.type === "select" ? project.name : project.displayName
          : undefined,
        projectIcon: projectIcon ?? undefined,
        url,
        notionUrl: "",
        lastEditedTime: new Date().toISOString(),
        creationDate: new Date().toISOString(),
      };

      // Optimistically add to query cache
      addTaskToCache(queryClient, databaseId, optimisticTask);

      // Check if offline - queue mutation and persist to local cache
      const isOffline = !useNetworkStore.getState().isConnected;
      if (isOffline) {
        // Queue the mutation for later sync
        await addMutation(tempId, "createTask", {
          title,
          statusId: status.id,
          statusName: status.name,
          doDate,
          dueDate,
          taskType,
          project,
          url,
        }, optimisticTask);
        // Persist to local cache
        await addCachedTask(optimisticTask);
      }

      return { previousTasks, tempId, optimisticTask, isOffline };
    },
    onError: (_error, _variables, context) => {
      console.error("Failed to create task:", _error);
      // Rollback on error
      if (context?.previousTasks) {
        queryClient.setQueryData([...TASKS_QUERY_KEY, databaseId, "active"], context.previousTasks);
      }
      showToast("Failed to create task", "error");
    },
    onSuccess: async (data, _variables, context) => {
      if (!data.queued && data.task && context?.tempId) {
        // Replace temp task with real task in query cache
        replaceTaskIdInCache(queryClient, databaseId, context.tempId, data.task);
        // Also persist to local cache
        await addCachedTask(data.task);
      }
      // If offline (queued), the task was already added to caches in onMutate
    },
    onSettled: (data) => {
      // Only invalidate if not queued (online mutation)
      // Delay to prevent UI flicker from optimistic update
      if (!data?.queued) {
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: [...TASKS_QUERY_KEY, databaseId, "active"] });
        }, 100);
      }
    },
  });
}
