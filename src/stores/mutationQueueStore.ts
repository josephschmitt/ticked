import { create } from "zustand";
import {
  storeMutationQueue,
  getMutationQueue,
  storeSyncConflicts,
  getSyncConflicts,
  clearMutationData,
} from "@/services/storage/asyncStorage";
import type {
  PendingMutation,
  SyncConflict,
  SyncStatus,
  MutationType,
  MutationPayloads,
  ConflictResolution,
} from "@/types/mutation";
import type { Task } from "@/types/task";

interface MutationQueueState {
  /** Queue of pending mutations waiting to be synced */
  queue: PendingMutation[];
  /** List of unresolved sync conflicts */
  conflicts: SyncConflict[];
  /** Current sync status */
  syncStatus: SyncStatus;
  /** Whether the store has been hydrated from storage */
  isHydrated: boolean;

  /** Add a mutation to the queue */
  addMutation: <T extends MutationType>(
    taskId: string,
    type: T,
    payload: MutationPayloads[T],
    originalTask: Task
  ) => Promise<string>;
  /** Remove a mutation from the queue (after successful sync) */
  removeMutation: (mutationId: string) => Promise<void>;
  /** Increment retry count for a mutation */
  incrementRetryCount: (mutationId: string) => Promise<void>;
  /** Get all mutations for a specific task (for coalescing) */
  getMutationsForTask: (taskId: string) => PendingMutation[];
  /** Clear the entire queue */
  clearQueue: () => Promise<void>;

  /** Add a conflict */
  addConflict: (conflict: SyncConflict) => Promise<void>;
  /** Resolve a conflict */
  resolveConflict: (conflictId: string, resolution: ConflictResolution) => Promise<void>;
  /** Get pending conflicts count */
  getPendingConflictsCount: () => number;

  /** Update sync status */
  setSyncStatus: (status: SyncStatus) => void;

  /** Clear all mutation data */
  clearAll: () => Promise<void>;
  /** Hydrate store from AsyncStorage */
  hydrate: () => Promise<void>;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export const useMutationQueueStore = create<MutationQueueState>((set, get) => ({
  queue: [],
  conflicts: [],
  syncStatus: "idle",
  isHydrated: false,

  addMutation: async (taskId, type, payload, originalTask) => {
    const { queue } = get();

    // Check if there's already a mutation for the same task and type
    // If so, update it instead of adding a new one (coalesce)
    const existingIndex = queue.findIndex(
      (m) => m.taskId === taskId && m.type === type
    );

    const id = generateId();
    const newMutation: PendingMutation = {
      id,
      taskId,
      type,
      payload,
      createdAt: new Date().toISOString(),
      retryCount: 0,
      originalTask,
    };

    let newQueue: PendingMutation[];
    if (existingIndex >= 0) {
      // Coalesce: replace existing mutation with new one
      newQueue = [...queue];
      newQueue[existingIndex] = newMutation;
    } else {
      newQueue = [...queue, newMutation];
    }

    await storeMutationQueue(newQueue);
    set({ queue: newQueue });
    return id;
  },

  removeMutation: async (mutationId) => {
    const { queue } = get();
    const newQueue = queue.filter((m) => m.id !== mutationId);
    await storeMutationQueue(newQueue);
    set({ queue: newQueue });
  },

  incrementRetryCount: async (mutationId) => {
    const { queue } = get();
    const newQueue = queue.map((m) =>
      m.id === mutationId ? { ...m, retryCount: m.retryCount + 1 } : m
    );
    await storeMutationQueue(newQueue);
    set({ queue: newQueue });
  },

  getMutationsForTask: (taskId) => {
    return get().queue.filter((m) => m.taskId === taskId);
  },

  clearQueue: async () => {
    await storeMutationQueue([]);
    set({ queue: [] });
  },

  addConflict: async (conflict) => {
    const { conflicts } = get();
    const newConflicts = [...conflicts, conflict];
    await storeSyncConflicts(newConflicts);
    set({ conflicts: newConflicts, syncStatus: "hasConflicts" });
  },

  resolveConflict: async (conflictId, resolution) => {
    const { conflicts } = get();
    const newConflicts = conflicts.map((c) =>
      c.id === conflictId
        ? {
            ...c,
            status: "resolved" as const,
            resolution,
            resolvedAt: new Date().toISOString(),
          }
        : c
    );
    // Remove resolved conflicts from storage
    const pendingConflicts = newConflicts.filter((c) => c.status === "pending");
    await storeSyncConflicts(pendingConflicts);
    set({
      conflicts: pendingConflicts,
      syncStatus: pendingConflicts.length > 0 ? "hasConflicts" : "idle",
    });
  },

  getPendingConflictsCount: () => {
    return get().conflicts.filter((c) => c.status === "pending").length;
  },

  setSyncStatus: (status) => {
    set({ syncStatus: status });
  },

  clearAll: async () => {
    await clearMutationData();
    set({
      queue: [],
      conflicts: [],
      syncStatus: "idle",
    });
  },

  hydrate: async () => {
    try {
      const [queue, conflicts] = await Promise.all([
        getMutationQueue(),
        getSyncConflicts(),
      ]);

      const pendingConflicts = conflicts.filter((c) => c.status === "pending");
      const syncStatus: SyncStatus =
        pendingConflicts.length > 0 ? "hasConflicts" : "idle";

      set({
        queue,
        conflicts: pendingConflicts,
        syncStatus,
        isHydrated: true,
      });
    } catch (error) {
      console.error("Failed to hydrate mutation queue store:", error);
      set({ isHydrated: true });
    }
  },
}));
