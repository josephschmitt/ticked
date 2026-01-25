import type { Task, TaskStatus } from "./task";

/**
 * Types of mutations that can be queued for offline sync.
 */
export type MutationType =
  | "updateStatus"
  | "updateCheckbox"
  | "updateTitle"
  | "updateDoDate"
  | "updateDueDate"
  | "updateCompletedDate"
  | "updateTaskType"
  | "updateProject"
  | "updateUrl";

/**
 * Payload types for each mutation type.
 */
export interface MutationPayloads {
  updateStatus: { newStatus: TaskStatus };
  updateCheckbox: { checked: boolean };
  updateTitle: { newTitle: string };
  updateDoDate: { date: string | null };
  updateDueDate: { date: string | null };
  updateCompletedDate: { date: string | null };
  updateTaskType: { optionName: string | null; isRelation?: boolean; pageIds?: string[] };
  updateProject: { optionName: string | null; isRelation?: boolean; pageIds?: string[] };
  updateUrl: { url: string | null };
}

/**
 * A mutation that is waiting to be synced to Notion.
 */
export interface PendingMutation<T extends MutationType = MutationType> {
  /** Unique identifier for this mutation */
  id: string;
  /** The task being mutated */
  taskId: string;
  /** Type of mutation */
  type: T;
  /** Mutation-specific data */
  payload: MutationPayloads[T];
  /** ISO timestamp when mutation was created */
  createdAt: string;
  /** Number of sync attempts */
  retryCount: number;
  /** Snapshot of the task at mutation time for conflict detection */
  originalTask: Task;
}

/**
 * Status of a sync conflict.
 */
export type ConflictStatus = "pending" | "resolved";

/**
 * Resolution strategy for a conflict.
 */
export type ConflictResolution = "keepLocal" | "keepServer" | "autoResolved";

/**
 * A conflict detected during sync.
 */
export interface SyncConflict {
  /** Unique identifier for this conflict */
  id: string;
  /** The mutation that caused the conflict */
  mutation: PendingMutation;
  /** The task state on the server when conflict was detected */
  serverTask: Task;
  /** When the conflict was detected */
  detectedAt: string;
  /** Current status of the conflict */
  status: ConflictStatus;
  /** How the conflict was resolved (if resolved) */
  resolution?: ConflictResolution;
  /** When the conflict was resolved */
  resolvedAt?: string;
}

/**
 * Result of processing a mutation.
 */
export interface MutationResult {
  success: boolean;
  conflict?: SyncConflict;
  error?: string;
}

/**
 * Overall sync status.
 */
export type SyncStatus = "idle" | "syncing" | "error" | "hasConflicts";
