import { describe, it, expect, beforeEach, vi } from "vitest";
import { useTaskCacheStore } from "./taskCacheStore";
import type { Task, TaskStatus } from "@/types/task";

// Mock AsyncStorage functions
vi.mock("@/services/storage/asyncStorage", () => ({
  storeCachedTasks: vi.fn().mockResolvedValue(undefined),
  getCachedTasks: vi.fn().mockResolvedValue([]),
  storeCachedStatuses: vi.fn().mockResolvedValue(undefined),
  getCachedStatuses: vi.fn().mockResolvedValue([]),
  storeLastSyncedAt: vi.fn().mockResolvedValue(undefined),
  getLastSyncedAt: vi.fn().mockResolvedValue(null),
  clearTaskCache: vi.fn().mockResolvedValue(undefined),
}));

// Helper to create a mock task
function createMockTask(overrides: Partial<Task> = {}): Task {
  const defaultStatus: TaskStatus = {
    id: "status-1",
    name: "To Do",
    color: "default",
    group: "todo",
  };

  return {
    id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: "Test Task",
    status: defaultStatus,
    notionUrl: "https://notion.so/test",
    lastEditedTime: new Date().toISOString(),
    ...overrides,
  };
}

// Helper to create a mock status
function createMockStatus(overrides: Partial<TaskStatus> = {}): TaskStatus {
  return {
    id: `status-${Date.now()}`,
    name: "Test Status",
    color: "blue",
    group: "todo",
    ...overrides,
  };
}

describe("taskCacheStore", () => {
  beforeEach(() => {
    // Reset store state before each test
    useTaskCacheStore.setState({
      tasks: [],
      statuses: [],
      lastSyncedAt: null,
      isHydrated: false,
    });
    vi.clearAllMocks();
  });

  describe("setTasks", () => {
    it("sets tasks and persists to storage", async () => {
      const { storeCachedTasks } = await import("@/services/storage/asyncStorage");
      const tasks = [
        createMockTask({ id: "task-1", title: "Task 1" }),
        createMockTask({ id: "task-2", title: "Task 2" }),
      ];

      await useTaskCacheStore.getState().setTasks(tasks);

      const state = useTaskCacheStore.getState();
      expect(state.tasks).toHaveLength(2);
      expect(state.tasks).toEqual(tasks);
      expect(storeCachedTasks).toHaveBeenCalledWith(tasks);
    });

    it("replaces existing tasks", async () => {
      const initialTasks = [createMockTask({ id: "task-1" })];
      const newTasks = [createMockTask({ id: "task-2" }), createMockTask({ id: "task-3" })];

      await useTaskCacheStore.getState().setTasks(initialTasks);
      expect(useTaskCacheStore.getState().tasks).toHaveLength(1);

      await useTaskCacheStore.getState().setTasks(newTasks);
      expect(useTaskCacheStore.getState().tasks).toHaveLength(2);
      expect(useTaskCacheStore.getState().tasks[0].id).toBe("task-2");
    });

    it("handles empty array", async () => {
      const { storeCachedTasks } = await import("@/services/storage/asyncStorage");

      await useTaskCacheStore.getState().setTasks([]);

      expect(useTaskCacheStore.getState().tasks).toHaveLength(0);
      expect(storeCachedTasks).toHaveBeenCalledWith([]);
    });
  });

  describe("setStatuses", () => {
    it("sets statuses and persists to storage", async () => {
      const { storeCachedStatuses } = await import("@/services/storage/asyncStorage");
      const statuses = [
        createMockStatus({ id: "status-1", name: "To Do" }),
        createMockStatus({ id: "status-2", name: "Done" }),
      ];

      await useTaskCacheStore.getState().setStatuses(statuses);

      const state = useTaskCacheStore.getState();
      expect(state.statuses).toHaveLength(2);
      expect(state.statuses).toEqual(statuses);
      expect(storeCachedStatuses).toHaveBeenCalledWith(statuses);
    });

    it("replaces existing statuses", async () => {
      const initialStatuses = [createMockStatus({ id: "status-1" })];
      const newStatuses = [createMockStatus({ id: "status-2" }), createMockStatus({ id: "status-3" })];

      await useTaskCacheStore.getState().setStatuses(initialStatuses);
      expect(useTaskCacheStore.getState().statuses).toHaveLength(1);

      await useTaskCacheStore.getState().setStatuses(newStatuses);
      expect(useTaskCacheStore.getState().statuses).toHaveLength(2);
    });
  });

  describe("updateTask", () => {
    it("updates a single task in the cache", async () => {
      const { storeCachedTasks } = await import("@/services/storage/asyncStorage");
      const tasks = [
        createMockTask({ id: "task-1", title: "Original Title" }),
        createMockTask({ id: "task-2", title: "Another Task" }),
      ];

      await useTaskCacheStore.getState().setTasks(tasks);
      vi.clearAllMocks();

      await useTaskCacheStore.getState().updateTask("task-1", { title: "Updated Title" });

      const state = useTaskCacheStore.getState();
      expect(state.tasks[0].title).toBe("Updated Title");
      expect(state.tasks[1].title).toBe("Another Task"); // Unchanged
      expect(storeCachedTasks).toHaveBeenCalled();
    });

    it("can update multiple fields at once", async () => {
      const newStatus: TaskStatus = {
        id: "status-done",
        name: "Done",
        color: "green",
        group: "complete",
      };
      const tasks = [createMockTask({ id: "task-1", title: "Original", doDate: "2024-01-15" })];

      await useTaskCacheStore.getState().setTasks(tasks);
      await useTaskCacheStore.getState().updateTask("task-1", {
        title: "Updated",
        status: newStatus,
        doDate: "2024-01-20",
      });

      const state = useTaskCacheStore.getState();
      expect(state.tasks[0].title).toBe("Updated");
      expect(state.tasks[0].status).toEqual(newStatus);
      expect(state.tasks[0].doDate).toBe("2024-01-20");
    });

    it("does nothing if task does not exist", async () => {
      const { storeCachedTasks } = await import("@/services/storage/asyncStorage");
      const tasks = [createMockTask({ id: "task-1", title: "Original" })];

      await useTaskCacheStore.getState().setTasks(tasks);
      vi.clearAllMocks();

      await useTaskCacheStore.getState().updateTask("non-existent", { title: "Updated" });

      const state = useTaskCacheStore.getState();
      expect(state.tasks[0].title).toBe("Original");
      expect(storeCachedTasks).toHaveBeenCalled(); // Still persists (idempotent)
    });

    it("preserves task reference identity for unchanged tasks", async () => {
      const task1 = createMockTask({ id: "task-1", title: "Task 1" });
      const task2 = createMockTask({ id: "task-2", title: "Task 2" });

      await useTaskCacheStore.getState().setTasks([task1, task2]);
      const beforeUpdate = useTaskCacheStore.getState().tasks[1];

      await useTaskCacheStore.getState().updateTask("task-1", { title: "Updated" });

      // Task 2 should still have the same values
      const afterUpdate = useTaskCacheStore.getState().tasks[1];
      expect(afterUpdate.id).toBe(beforeUpdate.id);
      expect(afterUpdate.title).toBe(beforeUpdate.title);
    });
  });

  describe("setLastSyncedAt", () => {
    it("sets the last synced timestamp", async () => {
      const { storeLastSyncedAt } = await import("@/services/storage/asyncStorage");
      const timestamp = "2024-01-15T10:00:00.000Z";

      await useTaskCacheStore.getState().setLastSyncedAt(timestamp);

      const state = useTaskCacheStore.getState();
      expect(state.lastSyncedAt).toBe(timestamp);
      expect(storeLastSyncedAt).toHaveBeenCalledWith(timestamp);
    });

    it("can update to a newer timestamp", async () => {
      const timestamp1 = "2024-01-15T10:00:00.000Z";
      const timestamp2 = "2024-01-15T11:00:00.000Z";

      await useTaskCacheStore.getState().setLastSyncedAt(timestamp1);
      expect(useTaskCacheStore.getState().lastSyncedAt).toBe(timestamp1);

      await useTaskCacheStore.getState().setLastSyncedAt(timestamp2);
      expect(useTaskCacheStore.getState().lastSyncedAt).toBe(timestamp2);
    });
  });

  describe("clearCache", () => {
    it("clears all cached data", async () => {
      const { clearTaskCache } = await import("@/services/storage/asyncStorage");
      const tasks = [createMockTask()];
      const statuses = [createMockStatus()];

      await useTaskCacheStore.getState().setTasks(tasks);
      await useTaskCacheStore.getState().setStatuses(statuses);
      await useTaskCacheStore.getState().setLastSyncedAt("2024-01-15T10:00:00.000Z");

      expect(useTaskCacheStore.getState().tasks).toHaveLength(1);
      expect(useTaskCacheStore.getState().statuses).toHaveLength(1);
      expect(useTaskCacheStore.getState().lastSyncedAt).not.toBeNull();

      await useTaskCacheStore.getState().clearCache();

      const state = useTaskCacheStore.getState();
      expect(state.tasks).toHaveLength(0);
      expect(state.statuses).toHaveLength(0);
      expect(state.lastSyncedAt).toBeNull();
      expect(clearTaskCache).toHaveBeenCalled();
    });
  });

  describe("hydrate", () => {
    it("loads data from storage and sets isHydrated", async () => {
      const { getCachedTasks, getCachedStatuses, getLastSyncedAt } = await import(
        "@/services/storage/asyncStorage"
      );

      const tasks = [createMockTask({ id: "task-1" })];
      const statuses = [createMockStatus({ id: "status-1" })];
      const timestamp = "2024-01-15T10:00:00.000Z";

      vi.mocked(getCachedTasks).mockResolvedValueOnce(tasks);
      vi.mocked(getCachedStatuses).mockResolvedValueOnce(statuses);
      vi.mocked(getLastSyncedAt).mockResolvedValueOnce(timestamp);

      expect(useTaskCacheStore.getState().isHydrated).toBe(false);

      await useTaskCacheStore.getState().hydrate();

      const state = useTaskCacheStore.getState();
      expect(state.isHydrated).toBe(true);
      expect(state.tasks).toEqual(tasks);
      expect(state.statuses).toEqual(statuses);
      expect(state.lastSyncedAt).toBe(timestamp);
    });

    it("handles empty storage gracefully", async () => {
      const { getCachedTasks, getCachedStatuses, getLastSyncedAt } = await import(
        "@/services/storage/asyncStorage"
      );

      vi.mocked(getCachedTasks).mockResolvedValueOnce([]);
      vi.mocked(getCachedStatuses).mockResolvedValueOnce([]);
      vi.mocked(getLastSyncedAt).mockResolvedValueOnce(null);

      await useTaskCacheStore.getState().hydrate();

      const state = useTaskCacheStore.getState();
      expect(state.isHydrated).toBe(true);
      expect(state.tasks).toHaveLength(0);
      expect(state.statuses).toHaveLength(0);
      expect(state.lastSyncedAt).toBeNull();
    });

    it("sets isHydrated even if storage fails", async () => {
      const { getCachedTasks } = await import("@/services/storage/asyncStorage");

      vi.mocked(getCachedTasks).mockRejectedValueOnce(new Error("Storage error"));

      await useTaskCacheStore.getState().hydrate();

      expect(useTaskCacheStore.getState().isHydrated).toBe(true);
    });
  });

  describe("integration scenarios", () => {
    it("supports typical optimistic update workflow", async () => {
      // Initial load
      const tasks = [
        createMockTask({ id: "task-1", title: "Original Task" }),
        createMockTask({ id: "task-2", title: "Another Task" }),
      ];
      await useTaskCacheStore.getState().setTasks(tasks);

      // Optimistic update (user completes a task)
      const doneStatus: TaskStatus = {
        id: "status-done",
        name: "Done",
        color: "green",
        group: "complete",
      };
      await useTaskCacheStore.getState().updateTask("task-1", { status: doneStatus });

      // Verify update
      const updatedTask = useTaskCacheStore.getState().tasks.find((t) => t.id === "task-1");
      expect(updatedTask?.status.group).toBe("complete");

      // Sync success - update last synced
      await useTaskCacheStore.getState().setLastSyncedAt(new Date().toISOString());
      expect(useTaskCacheStore.getState().lastSyncedAt).not.toBeNull();
    });

    it("supports cache refresh from server", async () => {
      // Initial cache
      const oldTasks = [createMockTask({ id: "task-1", title: "Old Title" })];
      await useTaskCacheStore.getState().setTasks(oldTasks);

      // Simulate server fetch with updated data
      const newTasks = [
        createMockTask({ id: "task-1", title: "New Title" }),
        createMockTask({ id: "task-2", title: "New Task" }),
      ];
      await useTaskCacheStore.getState().setTasks(newTasks);
      await useTaskCacheStore.getState().setLastSyncedAt(new Date().toISOString());

      // Verify refresh
      const state = useTaskCacheStore.getState();
      expect(state.tasks).toHaveLength(2);
      expect(state.tasks[0].title).toBe("New Title");
    });
  });
});
