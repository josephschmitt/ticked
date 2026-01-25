import { getNotionClient } from "@/services/notion/client";
import {
  updateTaskStatus,
  updateTaskCheckbox,
  updateTaskTitle,
  updateTaskDate,
  updateTaskSelect,
  updateTaskRelation,
  updateTaskUrl,
} from "@/services/notion/operations/updatePage";
import { useMutationQueueStore } from "@/stores/mutationQueueStore";
import { useTaskCacheStore } from "@/stores/taskCacheStore";
import { useConfigStore } from "@/stores/configStore";
import { hasConflict, canAutoResolve, createConflict } from "./conflictDetection";
import type { PendingMutation, MutationResult, MutationPayloads } from "@/types/mutation";
import type { Task, TaskStatus } from "@/types/task";

const MAX_RETRY_COUNT = 3;

interface NotionPageResponse {
  id: string;
  url: string;
  last_edited_time: string;
  properties: Record<string, unknown>;
}

/**
 * Fetch a single task from Notion to check for conflicts.
 */
async function fetchTaskFromServer(taskId: string): Promise<Task | null> {
  try {
    const client = getNotionClient();
    const page = await client.pages.retrieve({ page_id: taskId }) as unknown as NotionPageResponse;

    // We only need the lastEditedTime for conflict detection
    // The full task will be refetched after sync
    return {
      id: page.id,
      title: "", // Not needed for conflict detection
      status: { id: "", name: "", color: "", group: "todo" },
      notionUrl: page.url,
      lastEditedTime: page.last_edited_time,
    };
  } catch (error) {
    console.error("Failed to fetch task from server:", error);
    return null;
  }
}

/**
 * Execute a single mutation against the Notion API.
 */
async function executeMutation(mutation: PendingMutation): Promise<void> {
  const fieldMapping = useConfigStore.getState().fieldMapping;
  if (!fieldMapping) {
    throw new Error("Field mapping not configured");
  }

  const { taskId, type, payload } = mutation;

  switch (type) {
    case "updateStatus": {
      const { newStatus } = payload as MutationPayloads["updateStatus"];
      if (!fieldMapping.status) throw new Error("Status field not configured");
      await updateTaskStatus(taskId, fieldMapping.status, newStatus.name);
      break;
    }

    case "updateCheckbox": {
      const { checked } = payload as MutationPayloads["updateCheckbox"];
      if (!fieldMapping.status) throw new Error("Status field not configured");
      await updateTaskCheckbox(taskId, fieldMapping.status, checked);
      break;
    }

    case "updateTitle": {
      const { newTitle } = payload as MutationPayloads["updateTitle"];
      if (!fieldMapping.taskName) throw new Error("Task name field not configured");
      await updateTaskTitle(taskId, fieldMapping.taskName, newTitle);
      break;
    }

    case "updateDoDate": {
      const { date } = payload as MutationPayloads["updateDoDate"];
      if (!fieldMapping.doDate) throw new Error("Do date field not configured");
      await updateTaskDate(taskId, fieldMapping.doDate, date);
      break;
    }

    case "updateDueDate": {
      const { date } = payload as MutationPayloads["updateDueDate"];
      if (!fieldMapping.dueDate) throw new Error("Due date field not configured");
      await updateTaskDate(taskId, fieldMapping.dueDate, date);
      break;
    }

    case "updateCompletedDate": {
      const { date } = payload as MutationPayloads["updateCompletedDate"];
      if (!fieldMapping.completedDate) throw new Error("Completed date field not configured");
      await updateTaskDate(taskId, fieldMapping.completedDate, date);
      break;
    }

    case "updateTaskType": {
      const { optionName, isRelation, pageIds } = payload as MutationPayloads["updateTaskType"];
      if (!fieldMapping.taskType) throw new Error("Task type field not configured");
      if (isRelation && pageIds) {
        await updateTaskRelation(taskId, fieldMapping.taskType, pageIds);
      } else {
        await updateTaskSelect(taskId, fieldMapping.taskType, optionName);
      }
      break;
    }

    case "updateProject": {
      const { optionName, isRelation, pageIds } = payload as MutationPayloads["updateProject"];
      if (!fieldMapping.project) throw new Error("Project field not configured");
      if (isRelation && pageIds) {
        await updateTaskRelation(taskId, fieldMapping.project, pageIds);
      } else {
        await updateTaskSelect(taskId, fieldMapping.project, optionName);
      }
      break;
    }

    case "updateUrl": {
      const { url } = payload as MutationPayloads["updateUrl"];
      if (!fieldMapping.url) throw new Error("URL field not configured");
      await updateTaskUrl(taskId, fieldMapping.url, url);
      break;
    }

    default:
      throw new Error(`Unknown mutation type: ${type}`);
  }
}

/**
 * Process a single mutation with conflict detection.
 */
async function processMutation(mutation: PendingMutation): Promise<MutationResult> {
  const queueStore = useMutationQueueStore.getState();

  try {
    // Fetch current task state from server
    const serverTask = await fetchTaskFromServer(mutation.taskId);

    if (!serverTask) {
      // Task might have been deleted - remove mutation
      await queueStore.removeMutation(mutation.id);
      return { success: true };
    }

    // Check for conflicts
    if (hasConflict(mutation, serverTask)) {
      // Can we auto-resolve?
      if (canAutoResolve(mutation, serverTask)) {
        // Apply the mutation anyway - the fields don't overlap
        await executeMutation(mutation);
        await queueStore.removeMutation(mutation.id);
        return { success: true };
      }

      // Create conflict for user resolution
      const conflict = createConflict(mutation, serverTask);
      await queueStore.addConflict(conflict);
      await queueStore.removeMutation(mutation.id);
      return { success: false, conflict };
    }

    // No conflict, execute the mutation
    await executeMutation(mutation);
    await queueStore.removeMutation(mutation.id);
    return { success: true };

  } catch (error) {
    console.error("Failed to process mutation:", error);

    // Increment retry count
    await queueStore.incrementRetryCount(mutation.id);

    // If we've exceeded retries, create a conflict for manual resolution
    if (mutation.retryCount >= MAX_RETRY_COUNT - 1) {
      const serverTask = await fetchTaskFromServer(mutation.taskId);
      if (serverTask) {
        const conflict = createConflict(mutation, serverTask);
        await queueStore.addConflict(conflict);
      }
      await queueStore.removeMutation(mutation.id);
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Process all pending mutations in the queue.
 */
export async function processQueue(): Promise<{
  processed: number;
  failed: number;
  conflicts: number;
}> {
  const queueStore = useMutationQueueStore.getState();
  const { queue } = queueStore;

  if (queue.length === 0) {
    return { processed: 0, failed: 0, conflicts: 0 };
  }

  queueStore.setSyncStatus("syncing");

  let processed = 0;
  let failed = 0;
  let conflicts = 0;

  // Process mutations in order (oldest first)
  const sortedQueue = [...queue].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  for (const mutation of sortedQueue) {
    const result = await processMutation(mutation);

    if (result.success) {
      processed++;
    } else if (result.conflict) {
      conflicts++;
    } else {
      failed++;
    }
  }

  // Update sync status
  const finalState = useMutationQueueStore.getState();
  if (finalState.conflicts.length > 0) {
    queueStore.setSyncStatus("hasConflicts");
  } else if (finalState.queue.length > 0) {
    queueStore.setSyncStatus("error");
  } else {
    queueStore.setSyncStatus("idle");
  }

  return { processed, failed, conflicts };
}

/**
 * Apply local changes from a mutation (for "keep local" conflict resolution).
 */
export async function applyLocalChanges(mutation: PendingMutation): Promise<boolean> {
  try {
    await executeMutation(mutation);
    return true;
  } catch (error) {
    console.error("Failed to apply local changes:", error);
    return false;
  }
}

/**
 * Get the local version of a task (with pending mutations applied).
 */
export function getLocalTaskState(taskId: string): Partial<Task> {
  const mutations = useMutationQueueStore.getState().getMutationsForTask(taskId);
  const cachedTasks = useTaskCacheStore.getState().tasks;
  const cachedTask = cachedTasks.find((t) => t.id === taskId);

  if (!cachedTask) {
    return {};
  }

  // Apply all pending mutations to get the local state
  let localTask: Partial<Task> = { ...cachedTask };

  for (const mutation of mutations) {
    switch (mutation.type) {
      case "updateStatus":
        localTask.status = (mutation.payload as MutationPayloads["updateStatus"]).newStatus;
        break;
      case "updateCheckbox": {
        const checked = (mutation.payload as MutationPayloads["updateCheckbox"]).checked;
        localTask.status = checked
          ? { id: "checked", name: "Complete", color: "green", group: "complete" }
          : { id: "unchecked", name: "To Do", color: "default", group: "todo" };
        break;
      }
      case "updateTitle":
        localTask.title = (mutation.payload as MutationPayloads["updateTitle"]).newTitle;
        break;
      case "updateDoDate":
        localTask.doDate = (mutation.payload as MutationPayloads["updateDoDate"]).date || undefined;
        break;
      case "updateDueDate":
        localTask.dueDate = (mutation.payload as MutationPayloads["updateDueDate"]).date || undefined;
        break;
      case "updateCompletedDate":
        localTask.completedDate = (mutation.payload as MutationPayloads["updateCompletedDate"]).date || undefined;
        break;
      case "updateTaskType":
        localTask.taskType = (mutation.payload as MutationPayloads["updateTaskType"]).optionName || undefined;
        break;
      case "updateProject":
        localTask.project = (mutation.payload as MutationPayloads["updateProject"]).optionName || undefined;
        break;
      case "updateUrl":
        localTask.url = (mutation.payload as MutationPayloads["updateUrl"]).url || undefined;
        break;
    }
  }

  return localTask;
}
