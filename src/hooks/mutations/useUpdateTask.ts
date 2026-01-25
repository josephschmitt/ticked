import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useConfigStore } from "@/stores/configStore";
import { useToastStore } from "@/stores/toastStore";
import {
  updateTaskStatus,
  updateTaskCheckbox,
  updateTaskTitle,
  updateTaskDate,
  updateTaskSelect,
  updateTaskRelation,
  updateTaskUrl,
} from "@/services/notion/operations/updatePage";
import {
  TASKS_QUERY_KEY,
  COMPLETED_TASKS_QUERY_KEY,
} from "@/hooks/queries/useTasks";
import type { Task, TaskStatus } from "@/types/task";

interface UpdateStatusParams {
  task: Task;
  newStatus: TaskStatus;
}

interface UpdateCheckboxParams {
  task: Task;
  checked: boolean;
}

interface UpdateTitleParams {
  task: Task;
  newTitle: string;
}

interface UpdateDateParams {
  task: Task;
  field: "doDate" | "dueDate" | "completedDate";
  date: string | null;
}

interface UpdateSelectParams {
  task: Task;
  field: "taskType" | "project";
  optionName: string | null;
}

interface UpdateRelationParams {
  task: Task;
  field: "taskType" | "project";
  pageIds: string[];
  displayName: string | null;
}

interface UpdateUrlParams {
  task: Task;
  url: string | null;
}

/**
 * Helper to update a task in the cache.
 */
function updateTaskInCache(
  queryClient: ReturnType<typeof useQueryClient>,
  databaseId: string | null,
  taskId: string,
  updater: (task: Task) => Task
) {
  // Update main tasks cache
  queryClient.setQueryData<Task[]>(
    [...TASKS_QUERY_KEY, databaseId],
    (oldTasks) => {
      if (!oldTasks) return oldTasks;
      return oldTasks.map((t) => (t.id === taskId ? updater(t) : t));
    }
  );

  // Update completed tasks cache (infinite query format)
  queryClient.setQueryData(
    [...COMPLETED_TASKS_QUERY_KEY, databaseId],
    (oldData: { pages: Array<{ tasks: Task[]; hasMore: boolean; nextCursor: string | null }> } | undefined) => {
      if (!oldData?.pages) return oldData;
      return {
        ...oldData,
        pages: oldData.pages.map((page) => ({
          ...page,
          tasks: page.tasks.map((t) => (t.id === taskId ? updater(t) : t)),
        })),
      };
    }
  );
}

/**
 * Hook to update task status (for status-type properties).
 */
export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();
  const databaseId = useConfigStore((state) => state.selectedDatabaseId);
  const fieldMapping = useConfigStore((state) => state.fieldMapping);
  const showToast = useToastStore((state) => state.showToast);

  return useMutation({
    mutationFn: async ({ task, newStatus }: UpdateStatusParams) => {
      if (!fieldMapping?.status) {
        throw new Error("Status field not configured");
      }
      await updateTaskStatus(task.id, fieldMapping.status, newStatus.name);
      return { task, newStatus };
    },
    onMutate: async ({ task, newStatus }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: [...TASKS_QUERY_KEY, databaseId] });
      await queryClient.cancelQueries({ queryKey: [...COMPLETED_TASKS_QUERY_KEY, databaseId] });

      // Snapshot previous value
      const previousTasks = queryClient.getQueryData<Task[]>([...TASKS_QUERY_KEY, databaseId]);
      const previousCompleted = queryClient.getQueryData([...COMPLETED_TASKS_QUERY_KEY, databaseId]);

      // Optimistically update
      updateTaskInCache(queryClient, databaseId, task.id, (t) => ({
        ...t,
        status: newStatus,
      }));

      return { previousTasks, previousCompleted };
    },
    onError: (_error, _variables, context) => {
      // Rollback on error
      if (context?.previousTasks) {
        queryClient.setQueryData([...TASKS_QUERY_KEY, databaseId], context.previousTasks);
      }
      if (context?.previousCompleted) {
        queryClient.setQueryData([...COMPLETED_TASKS_QUERY_KEY, databaseId], context.previousCompleted);
      }
      showToast("Failed to update status", "error");
    },
    onSettled: () => {
      // Refetch to ensure sync with server
      queryClient.invalidateQueries({ queryKey: [...TASKS_QUERY_KEY, databaseId] });
      queryClient.invalidateQueries({ queryKey: [...COMPLETED_TASKS_QUERY_KEY, databaseId] });
    },
  });
}

/**
 * Hook to update task checkbox (for checkbox-type status properties).
 */
export function useUpdateTaskCheckbox() {
  const queryClient = useQueryClient();
  const databaseId = useConfigStore((state) => state.selectedDatabaseId);
  const fieldMapping = useConfigStore((state) => state.fieldMapping);
  const showToast = useToastStore((state) => state.showToast);

  return useMutation({
    mutationFn: async ({ task, checked }: UpdateCheckboxParams) => {
      if (!fieldMapping?.status) {
        throw new Error("Status field not configured");
      }
      await updateTaskCheckbox(task.id, fieldMapping.status, checked);
      return { task, checked };
    },
    onMutate: async ({ task, checked }) => {
      await queryClient.cancelQueries({ queryKey: [...TASKS_QUERY_KEY, databaseId] });
      await queryClient.cancelQueries({ queryKey: [...COMPLETED_TASKS_QUERY_KEY, databaseId] });

      const previousTasks = queryClient.getQueryData<Task[]>([...TASKS_QUERY_KEY, databaseId]);
      const previousCompleted = queryClient.getQueryData([...COMPLETED_TASKS_QUERY_KEY, databaseId]);

      // Create checkbox status
      const newStatus: TaskStatus = checked
        ? { id: "checked", name: "Complete", color: "green", group: "complete" }
        : { id: "unchecked", name: "To Do", color: "default", group: "todo" };

      updateTaskInCache(queryClient, databaseId, task.id, (t) => ({
        ...t,
        status: newStatus,
      }));

      return { previousTasks, previousCompleted };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData([...TASKS_QUERY_KEY, databaseId], context.previousTasks);
      }
      if (context?.previousCompleted) {
        queryClient.setQueryData([...COMPLETED_TASKS_QUERY_KEY, databaseId], context.previousCompleted);
      }
      showToast("Failed to update status", "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [...TASKS_QUERY_KEY, databaseId] });
      queryClient.invalidateQueries({ queryKey: [...COMPLETED_TASKS_QUERY_KEY, databaseId] });
    },
  });
}

/**
 * Hook to update task title.
 */
export function useUpdateTaskTitle() {
  const queryClient = useQueryClient();
  const databaseId = useConfigStore((state) => state.selectedDatabaseId);
  const fieldMapping = useConfigStore((state) => state.fieldMapping);
  const showToast = useToastStore((state) => state.showToast);

  return useMutation({
    mutationFn: async ({ task, newTitle }: UpdateTitleParams) => {
      if (!fieldMapping?.taskName) {
        throw new Error("Task name field not configured");
      }
      await updateTaskTitle(task.id, fieldMapping.taskName, newTitle);
      return { task, newTitle };
    },
    onMutate: async ({ task, newTitle }) => {
      await queryClient.cancelQueries({ queryKey: [...TASKS_QUERY_KEY, databaseId] });
      await queryClient.cancelQueries({ queryKey: [...COMPLETED_TASKS_QUERY_KEY, databaseId] });

      const previousTasks = queryClient.getQueryData<Task[]>([...TASKS_QUERY_KEY, databaseId]);
      const previousCompleted = queryClient.getQueryData([...COMPLETED_TASKS_QUERY_KEY, databaseId]);

      updateTaskInCache(queryClient, databaseId, task.id, (t) => ({
        ...t,
        title: newTitle,
      }));

      return { previousTasks, previousCompleted };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData([...TASKS_QUERY_KEY, databaseId], context.previousTasks);
      }
      if (context?.previousCompleted) {
        queryClient.setQueryData([...COMPLETED_TASKS_QUERY_KEY, databaseId], context.previousCompleted);
      }
      showToast("Failed to update title", "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [...TASKS_QUERY_KEY, databaseId] });
      queryClient.invalidateQueries({ queryKey: [...COMPLETED_TASKS_QUERY_KEY, databaseId] });
    },
  });
}

/**
 * Hook to update task date fields.
 */
export function useUpdateTaskDate() {
  const queryClient = useQueryClient();
  const databaseId = useConfigStore((state) => state.selectedDatabaseId);
  const fieldMapping = useConfigStore((state) => state.fieldMapping);
  const showToast = useToastStore((state) => state.showToast);

  return useMutation({
    mutationFn: async ({ task, field, date }: UpdateDateParams) => {
      const propertyId = fieldMapping?.[field];
      if (!propertyId) {
        throw new Error(`${field} field not configured`);
      }
      await updateTaskDate(task.id, propertyId, date);
      return { task, field, date };
    },
    onMutate: async ({ task, field, date }) => {
      await queryClient.cancelQueries({ queryKey: [...TASKS_QUERY_KEY, databaseId] });
      await queryClient.cancelQueries({ queryKey: [...COMPLETED_TASKS_QUERY_KEY, databaseId] });

      const previousTasks = queryClient.getQueryData<Task[]>([...TASKS_QUERY_KEY, databaseId]);
      const previousCompleted = queryClient.getQueryData([...COMPLETED_TASKS_QUERY_KEY, databaseId]);

      updateTaskInCache(queryClient, databaseId, task.id, (t) => ({
        ...t,
        [field]: date || undefined,
      }));

      return { previousTasks, previousCompleted };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData([...TASKS_QUERY_KEY, databaseId], context.previousTasks);
      }
      if (context?.previousCompleted) {
        queryClient.setQueryData([...COMPLETED_TASKS_QUERY_KEY, databaseId], context.previousCompleted);
      }
      showToast("Failed to update date", "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [...TASKS_QUERY_KEY, databaseId] });
      queryClient.invalidateQueries({ queryKey: [...COMPLETED_TASKS_QUERY_KEY, databaseId] });
    },
  });
}

/**
 * Hook to update task select fields (taskType, project).
 */
export function useUpdateTaskSelect() {
  const queryClient = useQueryClient();
  const databaseId = useConfigStore((state) => state.selectedDatabaseId);
  const fieldMapping = useConfigStore((state) => state.fieldMapping);
  const showToast = useToastStore((state) => state.showToast);

  return useMutation({
    mutationFn: async ({ task, field, optionName }: UpdateSelectParams) => {
      const propertyId = fieldMapping?.[field];
      if (!propertyId) {
        throw new Error(`${field} field not configured`);
      }
      await updateTaskSelect(task.id, propertyId, optionName);
      return { task, field, optionName };
    },
    onMutate: async ({ task, field, optionName }) => {
      await queryClient.cancelQueries({ queryKey: [...TASKS_QUERY_KEY, databaseId] });
      await queryClient.cancelQueries({ queryKey: [...COMPLETED_TASKS_QUERY_KEY, databaseId] });

      const previousTasks = queryClient.getQueryData<Task[]>([...TASKS_QUERY_KEY, databaseId]);
      const previousCompleted = queryClient.getQueryData([...COMPLETED_TASKS_QUERY_KEY, databaseId]);

      updateTaskInCache(queryClient, databaseId, task.id, (t) => ({
        ...t,
        [field]: optionName || undefined,
      }));

      return { previousTasks, previousCompleted };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData([...TASKS_QUERY_KEY, databaseId], context.previousTasks);
      }
      if (context?.previousCompleted) {
        queryClient.setQueryData([...COMPLETED_TASKS_QUERY_KEY, databaseId], context.previousCompleted);
      }
      showToast("Failed to update field", "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [...TASKS_QUERY_KEY, databaseId] });
      queryClient.invalidateQueries({ queryKey: [...COMPLETED_TASKS_QUERY_KEY, databaseId] });
    },
  });
}

/**
 * Hook to update task relation fields (taskType, project).
 */
export function useUpdateTaskRelation() {
  const queryClient = useQueryClient();
  const databaseId = useConfigStore((state) => state.selectedDatabaseId);
  const fieldMapping = useConfigStore((state) => state.fieldMapping);
  const showToast = useToastStore((state) => state.showToast);

  return useMutation({
    mutationFn: async ({ task, field, pageIds }: UpdateRelationParams) => {
      const propertyId = fieldMapping?.[field];
      if (!propertyId) {
        throw new Error(`${field} field not configured`);
      }
      await updateTaskRelation(task.id, propertyId, pageIds);
      return { task, field, pageIds };
    },
    onMutate: async ({ task, field, displayName }) => {
      await queryClient.cancelQueries({ queryKey: [...TASKS_QUERY_KEY, databaseId] });
      await queryClient.cancelQueries({ queryKey: [...COMPLETED_TASKS_QUERY_KEY, databaseId] });

      const previousTasks = queryClient.getQueryData<Task[]>([...TASKS_QUERY_KEY, databaseId]);
      const previousCompleted = queryClient.getQueryData([...COMPLETED_TASKS_QUERY_KEY, databaseId]);

      updateTaskInCache(queryClient, databaseId, task.id, (t) => ({
        ...t,
        [field]: displayName || undefined,
      }));

      return { previousTasks, previousCompleted };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData([...TASKS_QUERY_KEY, databaseId], context.previousTasks);
      }
      if (context?.previousCompleted) {
        queryClient.setQueryData([...COMPLETED_TASKS_QUERY_KEY, databaseId], context.previousCompleted);
      }
      showToast("Failed to update field", "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [...TASKS_QUERY_KEY, databaseId] });
      queryClient.invalidateQueries({ queryKey: [...COMPLETED_TASKS_QUERY_KEY, databaseId] });
    },
  });
}

/**
 * Hook to update task URL.
 */
export function useUpdateTaskUrl() {
  const queryClient = useQueryClient();
  const databaseId = useConfigStore((state) => state.selectedDatabaseId);
  const fieldMapping = useConfigStore((state) => state.fieldMapping);
  const showToast = useToastStore((state) => state.showToast);

  return useMutation({
    mutationFn: async ({ task, url }: UpdateUrlParams) => {
      const propertyId = fieldMapping?.url;
      if (!propertyId) {
        throw new Error("URL field not configured");
      }
      await updateTaskUrl(task.id, propertyId, url);
      return { task, url };
    },
    onMutate: async ({ task, url }) => {
      await queryClient.cancelQueries({ queryKey: [...TASKS_QUERY_KEY, databaseId] });
      await queryClient.cancelQueries({ queryKey: [...COMPLETED_TASKS_QUERY_KEY, databaseId] });

      const previousTasks = queryClient.getQueryData<Task[]>([...TASKS_QUERY_KEY, databaseId]);
      const previousCompleted = queryClient.getQueryData([...COMPLETED_TASKS_QUERY_KEY, databaseId]);

      updateTaskInCache(queryClient, databaseId, task.id, (t) => ({
        ...t,
        url: url || undefined,
      }));

      return { previousTasks, previousCompleted };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData([...TASKS_QUERY_KEY, databaseId], context.previousTasks);
      }
      if (context?.previousCompleted) {
        queryClient.setQueryData([...COMPLETED_TASKS_QUERY_KEY, databaseId], context.previousCompleted);
      }
      showToast("Failed to update URL", "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [...TASKS_QUERY_KEY, databaseId] });
      queryClient.invalidateQueries({ queryKey: [...COMPLETED_TASKS_QUERY_KEY, databaseId] });
    },
  });
}
