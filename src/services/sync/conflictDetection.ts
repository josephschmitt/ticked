import type { Task } from "@/types/task";
import type { PendingMutation, SyncConflict } from "@/types/mutation";

/**
 * Check if a task has been modified on the server since the mutation was created.
 * Uses lastEditedTime to detect conflicts.
 */
export function hasConflict(
  mutation: PendingMutation,
  serverTask: Task
): boolean {
  const originalTime = new Date(mutation.originalTask.lastEditedTime).getTime();
  const serverTime = new Date(serverTask.lastEditedTime).getTime();

  // If server was modified after the mutation was created, there's a conflict
  return serverTime > originalTime;
}

/**
 * Generate a unique ID for a conflict.
 */
function generateConflictId(): string {
  return `conflict-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a SyncConflict object from a mutation and server task.
 */
export function createConflict(
  mutation: PendingMutation,
  serverTask: Task
): SyncConflict {
  return {
    id: generateConflictId(),
    mutation,
    serverTask,
    detectedAt: new Date().toISOString(),
    status: "pending",
  };
}

/**
 * Determine if a conflict can be auto-resolved.
 * We auto-resolve when the local and server changes don't overlap.
 */
export function canAutoResolve(
  mutation: PendingMutation,
  serverTask: Task
): boolean {
  // Check what field the mutation is changing
  const mutationType = mutation.type;
  const originalTask = mutation.originalTask;

  switch (mutationType) {
    case "updateStatus":
    case "updateCheckbox":
      // Check if status changed on server
      return serverTask.status.id === originalTask.status.id;

    case "updateTitle":
      // Check if title changed on server
      return serverTask.title === originalTask.title;

    case "updateDoDate":
      // Check if doDate changed on server
      return serverTask.doDate === originalTask.doDate;

    case "updateDueDate":
      // Check if dueDate changed on server
      return serverTask.dueDate === originalTask.dueDate;

    case "updateCompletedDate":
      // Check if completedDate changed on server
      return serverTask.completedDate === originalTask.completedDate;

    case "updateTaskType":
      // Check if taskType changed on server
      return serverTask.taskType === originalTask.taskType;

    case "updateProject":
      // Check if project changed on server
      return serverTask.project === originalTask.project;

    case "updateUrl":
      // Check if url changed on server
      return serverTask.url === originalTask.url;

    default:
      // Unknown mutation type, don't auto-resolve
      return false;
  }
}

/**
 * Get a human-readable description of what changed.
 */
export function getConflictDescription(conflict: SyncConflict): {
  localChange: string;
  serverChange: string;
} {
  const mutation = conflict.mutation;
  const originalTask = mutation.originalTask;
  const serverTask = conflict.serverTask;

  switch (mutation.type) {
    case "updateStatus":
      return {
        localChange: `Changed status to "${(mutation.payload as { newStatus: { name: string } }).newStatus.name}"`,
        serverChange: `Server status is now "${serverTask.status.name}"`,
      };

    case "updateCheckbox":
      return {
        localChange: `${(mutation.payload as { checked: boolean }).checked ? "Completed" : "Uncompleted"} task`,
        serverChange: `Server shows task as ${serverTask.status.group === "complete" ? "completed" : "incomplete"}`,
      };

    case "updateTitle":
      return {
        localChange: `Changed title to "${(mutation.payload as { newTitle: string }).newTitle}"`,
        serverChange: `Server title is now "${serverTask.title}"`,
      };

    case "updateDoDate":
      return {
        localChange: `Changed do date to "${(mutation.payload as { date: string | null }).date || "none"}"`,
        serverChange: `Server do date is now "${serverTask.doDate || "none"}"`,
      };

    case "updateDueDate":
      return {
        localChange: `Changed due date to "${(mutation.payload as { date: string | null }).date || "none"}"`,
        serverChange: `Server due date is now "${serverTask.dueDate || "none"}"`,
      };

    case "updateCompletedDate":
      return {
        localChange: `Changed completed date to "${(mutation.payload as { date: string | null }).date || "none"}"`,
        serverChange: `Server completed date is now "${serverTask.completedDate || "none"}"`,
      };

    case "updateTaskType":
      return {
        localChange: `Changed type to "${(mutation.payload as { optionName: string | null }).optionName || "none"}"`,
        serverChange: `Server type is now "${serverTask.taskType || "none"}"`,
      };

    case "updateProject":
      return {
        localChange: `Changed project to "${(mutation.payload as { optionName: string | null }).optionName || "none"}"`,
        serverChange: `Server project is now "${serverTask.project || "none"}"`,
      };

    case "updateUrl":
      return {
        localChange: `Changed URL to "${(mutation.payload as { url: string | null }).url || "none"}"`,
        serverChange: `Server URL is now "${serverTask.url || "none"}"`,
      };

    default:
      return {
        localChange: "Made local changes",
        serverChange: "Server has different changes",
      };
  }
}
