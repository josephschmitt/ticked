import { create } from "zustand";
import {
  storeCachedTasks,
  getCachedTasks,
  storeCachedStatuses,
  getCachedStatuses,
  storeLastSyncedAt,
  getLastSyncedAt,
  clearTaskCache,
} from "@/services/storage/asyncStorage";
import type { Task, TaskStatus } from "@/types/task";

interface TaskCacheState {
  /** Cached tasks from last successful fetch */
  tasks: Task[];
  /** Cached status options */
  statuses: TaskStatus[];
  /** ISO timestamp of last successful sync */
  lastSyncedAt: string | null;
  /** Whether the store has been hydrated from storage */
  isHydrated: boolean;

  /** Update cached tasks */
  setTasks: (tasks: Task[]) => Promise<void>;
  /** Update cached statuses */
  setStatuses: (statuses: TaskStatus[]) => Promise<void>;
  /** Update a single task in the cache (for optimistic updates) */
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  /** Update last synced timestamp */
  setLastSyncedAt: (timestamp: string) => Promise<void>;
  /** Clear all cached data */
  clearCache: () => Promise<void>;
  /** Hydrate store from AsyncStorage */
  hydrate: () => Promise<void>;
}

export const useTaskCacheStore = create<TaskCacheState>((set, get) => ({
  tasks: [],
  statuses: [],
  lastSyncedAt: null,
  isHydrated: false,

  setTasks: async (tasks) => {
    // Persist to storage
    await storeCachedTasks(tasks);
    // Update state
    set({ tasks });
  },

  setStatuses: async (statuses) => {
    // Persist to storage
    await storeCachedStatuses(statuses);
    // Update state
    set({ statuses });
  },

  updateTask: async (taskId, updates) => {
    const { tasks } = get();
    const updatedTasks = tasks.map((task) =>
      task.id === taskId ? { ...task, ...updates } : task
    );
    // Persist to storage
    await storeCachedTasks(updatedTasks);
    // Update state
    set({ tasks: updatedTasks });
  },

  setLastSyncedAt: async (timestamp) => {
    await storeLastSyncedAt(timestamp);
    set({ lastSyncedAt: timestamp });
  },

  clearCache: async () => {
    await clearTaskCache();
    set({
      tasks: [],
      statuses: [],
      lastSyncedAt: null,
    });
  },

  hydrate: async () => {
    try {
      const [tasks, statuses, lastSyncedAt] = await Promise.all([
        getCachedTasks(),
        getCachedStatuses(),
        getLastSyncedAt(),
      ]);

      set({
        tasks,
        statuses,
        lastSyncedAt,
        isHydrated: true,
      });
    } catch (error) {
      console.error("Failed to hydrate task cache store:", error);
      set({ isHydrated: true });
    }
  },
}));
