import { describe, it, expect, beforeEach, vi } from "vitest";
import { useMutationQueueStore } from "./mutationQueueStore";
import type { Task, TaskStatus } from "@/types/task";
import type { SyncConflict } from "@/types/mutation";

// Mock AsyncStorage functions
vi.mock("@/services/storage/asyncStorage", () => ({
  storeMutationQueue: vi.fn().mockResolvedValue(undefined),
  getMutationQueue: vi.fn().mockResolvedValue([]),
  storeSyncConflicts: vi.fn().mockResolvedValue(undefined),
  getSyncConflicts: vi.fn().mockResolvedValue([]),
  clearMutationData: vi.fn().mockResolvedValue(undefined),
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

// Helper to create a mock conflict
function createMockConflict(overrides: Partial<SyncConflict> = {}): SyncConflict {
  const task = createMockTask();
  return {
    id: `conflict-${Date.now()}`,
    mutation: {
      id: "mutation-1",
      taskId: task.id,
      type: "updateTitle",
      payload: { newTitle: "New Title" },
      createdAt: new Date().toISOString(),
      retryCount: 0,
      originalTask: task,
    },
    serverTask: task,
    detectedAt: new Date().toISOString(),
    status: "pending",
    ...overrides,
  };
}

describe("mutationQueueStore", () => {
  beforeEach(() => {
    // Reset store state before each test
    useMutationQueueStore.setState({
      queue: [],
      conflicts: [],
      syncStatus: "idle",
      isHydrated: false,
    });
    vi.clearAllMocks();
  });

  describe("addMutation", () => {
    it("adds a new mutation to the queue", async () => {
      const store = useMutationQueueStore.getState();
      const task = createMockTask({ id: "task-1" });

      const mutationId = await store.addMutation(
        task.id,
        "updateTitle",
        { newTitle: "New Title" },
        task
      );

      const state = useMutationQueueStore.getState();
      expect(state.queue).toHaveLength(1);
      expect(state.queue[0].id).toBe(mutationId);
      expect(state.queue[0].taskId).toBe("task-1");
      expect(state.queue[0].type).toBe("updateTitle");
      expect(state.queue[0].payload).toEqual({ newTitle: "New Title" });
      expect(state.queue[0].retryCount).toBe(0);
    });

    it("coalesces mutations for the same task and type", async () => {
      const store = useMutationQueueStore.getState();
      const task = createMockTask({ id: "task-1" });

      // Add first mutation
      await store.addMutation(
        task.id,
        "updateTitle",
        { newTitle: "First Title" },
        task
      );

      // Add second mutation for same task and type
      const secondId = await store.addMutation(
        task.id,
        "updateTitle",
        { newTitle: "Second Title" },
        task
      );

      const state = useMutationQueueStore.getState();
      expect(state.queue).toHaveLength(1); // Still only 1 mutation
      expect(state.queue[0].id).toBe(secondId);
      expect(state.queue[0].payload).toEqual({ newTitle: "Second Title" });
    });

    it("does not coalesce mutations for different tasks", async () => {
      const store = useMutationQueueStore.getState();
      const task1 = createMockTask({ id: "task-1" });
      const task2 = createMockTask({ id: "task-2" });

      await store.addMutation(
        task1.id,
        "updateTitle",
        { newTitle: "Title 1" },
        task1
      );
      await store.addMutation(
        task2.id,
        "updateTitle",
        { newTitle: "Title 2" },
        task2
      );

      const state = useMutationQueueStore.getState();
      expect(state.queue).toHaveLength(2);
    });

    it("does not coalesce mutations for different types on same task", async () => {
      const store = useMutationQueueStore.getState();
      const task = createMockTask({ id: "task-1" });

      await store.addMutation(
        task.id,
        "updateTitle",
        { newTitle: "New Title" },
        task
      );
      await store.addMutation(
        task.id,
        "updateDoDate",
        { date: "2024-01-20" },
        task
      );

      const state = useMutationQueueStore.getState();
      expect(state.queue).toHaveLength(2);
    });

    it("sets correct timestamps", async () => {
      const store = useMutationQueueStore.getState();
      const task = createMockTask();
      const before = new Date().toISOString();

      await store.addMutation(
        task.id,
        "updateTitle",
        { newTitle: "New Title" },
        task
      );

      const after = new Date().toISOString();
      const state = useMutationQueueStore.getState();
      expect(state.queue[0].createdAt >= before).toBe(true);
      expect(state.queue[0].createdAt <= after).toBe(true);
    });
  });

  describe("removeMutation", () => {
    it("removes a mutation from the queue", async () => {
      const store = useMutationQueueStore.getState();
      const task = createMockTask();

      const mutationId = await store.addMutation(
        task.id,
        "updateTitle",
        { newTitle: "New Title" },
        task
      );

      expect(useMutationQueueStore.getState().queue).toHaveLength(1);

      await useMutationQueueStore.getState().removeMutation(mutationId);

      expect(useMutationQueueStore.getState().queue).toHaveLength(0);
    });

    it("does nothing if mutation does not exist", async () => {
      const store = useMutationQueueStore.getState();
      const task = createMockTask();

      await store.addMutation(
        task.id,
        "updateTitle",
        { newTitle: "New Title" },
        task
      );

      await useMutationQueueStore.getState().removeMutation("non-existent-id");

      expect(useMutationQueueStore.getState().queue).toHaveLength(1);
    });
  });

  describe("incrementRetryCount", () => {
    it("increments the retry count of a mutation", async () => {
      const store = useMutationQueueStore.getState();
      const task = createMockTask();

      const mutationId = await store.addMutation(
        task.id,
        "updateTitle",
        { newTitle: "New Title" },
        task
      );

      expect(useMutationQueueStore.getState().queue[0].retryCount).toBe(0);

      await useMutationQueueStore.getState().incrementRetryCount(mutationId);

      expect(useMutationQueueStore.getState().queue[0].retryCount).toBe(1);

      await useMutationQueueStore.getState().incrementRetryCount(mutationId);

      expect(useMutationQueueStore.getState().queue[0].retryCount).toBe(2);
    });

    it("does not affect other mutations", async () => {
      const store = useMutationQueueStore.getState();
      const task1 = createMockTask({ id: "task-1" });
      const task2 = createMockTask({ id: "task-2" });

      const id1 = await store.addMutation(
        task1.id,
        "updateTitle",
        { newTitle: "Title 1" },
        task1
      );
      await store.addMutation(
        task2.id,
        "updateTitle",
        { newTitle: "Title 2" },
        task2
      );

      await useMutationQueueStore.getState().incrementRetryCount(id1);

      const state = useMutationQueueStore.getState();
      expect(state.queue[0].retryCount).toBe(1);
      expect(state.queue[1].retryCount).toBe(0);
    });
  });

  describe("getMutationsForTask", () => {
    it("returns all mutations for a specific task", async () => {
      const store = useMutationQueueStore.getState();
      const task = createMockTask({ id: "task-1" });
      const otherTask = createMockTask({ id: "task-2" });

      await store.addMutation(
        task.id,
        "updateTitle",
        { newTitle: "New Title" },
        task
      );
      await store.addMutation(
        task.id,
        "updateDoDate",
        { date: "2024-01-20" },
        task
      );
      await store.addMutation(
        otherTask.id,
        "updateTitle",
        { newTitle: "Other Title" },
        otherTask
      );

      const mutations = useMutationQueueStore.getState().getMutationsForTask("task-1");

      expect(mutations).toHaveLength(2);
      expect(mutations.every((m) => m.taskId === "task-1")).toBe(true);
    });

    it("returns empty array if no mutations for task", () => {
      const mutations = useMutationQueueStore.getState().getMutationsForTask("non-existent");
      expect(mutations).toHaveLength(0);
    });
  });

  describe("clearQueue", () => {
    it("removes all mutations from the queue", async () => {
      const store = useMutationQueueStore.getState();
      const task1 = createMockTask({ id: "task-1" });
      const task2 = createMockTask({ id: "task-2" });

      await store.addMutation(
        task1.id,
        "updateTitle",
        { newTitle: "Title 1" },
        task1
      );
      await store.addMutation(
        task2.id,
        "updateTitle",
        { newTitle: "Title 2" },
        task2
      );

      expect(useMutationQueueStore.getState().queue).toHaveLength(2);

      await useMutationQueueStore.getState().clearQueue();

      expect(useMutationQueueStore.getState().queue).toHaveLength(0);
    });
  });

  describe("addConflict", () => {
    it("adds a conflict and updates sync status", async () => {
      const conflict = createMockConflict();

      await useMutationQueueStore.getState().addConflict(conflict);

      const state = useMutationQueueStore.getState();
      expect(state.conflicts).toHaveLength(1);
      expect(state.conflicts[0]).toBe(conflict);
      expect(state.syncStatus).toBe("hasConflicts");
    });

    it("can add multiple conflicts", async () => {
      const conflict1 = createMockConflict({ id: "conflict-1" });
      const conflict2 = createMockConflict({ id: "conflict-2" });

      await useMutationQueueStore.getState().addConflict(conflict1);
      await useMutationQueueStore.getState().addConflict(conflict2);

      const state = useMutationQueueStore.getState();
      expect(state.conflicts).toHaveLength(2);
    });
  });

  describe("resolveConflict", () => {
    it("resolves a conflict with keepLocal", async () => {
      const conflict = createMockConflict({ id: "conflict-1" });
      await useMutationQueueStore.getState().addConflict(conflict);

      await useMutationQueueStore.getState().resolveConflict("conflict-1", "keepLocal");

      const state = useMutationQueueStore.getState();
      // Resolved conflicts are removed from the list
      expect(state.conflicts).toHaveLength(0);
      expect(state.syncStatus).toBe("idle");
    });

    it("resolves a conflict with keepServer", async () => {
      const conflict = createMockConflict({ id: "conflict-1" });
      await useMutationQueueStore.getState().addConflict(conflict);

      await useMutationQueueStore.getState().resolveConflict("conflict-1", "keepServer");

      const state = useMutationQueueStore.getState();
      expect(state.conflicts).toHaveLength(0);
      expect(state.syncStatus).toBe("idle");
    });

    it("keeps hasConflicts status if other conflicts remain", async () => {
      const conflict1 = createMockConflict({ id: "conflict-1" });
      const conflict2 = createMockConflict({ id: "conflict-2" });
      await useMutationQueueStore.getState().addConflict(conflict1);
      await useMutationQueueStore.getState().addConflict(conflict2);

      await useMutationQueueStore.getState().resolveConflict("conflict-1", "keepLocal");

      const state = useMutationQueueStore.getState();
      expect(state.conflicts).toHaveLength(1);
      expect(state.conflicts[0].id).toBe("conflict-2");
      expect(state.syncStatus).toBe("hasConflicts");
    });
  });

  describe("getPendingConflictsCount", () => {
    it("returns count of pending conflicts", async () => {
      expect(useMutationQueueStore.getState().getPendingConflictsCount()).toBe(0);

      const conflict1 = createMockConflict({ id: "conflict-1", status: "pending" });
      const conflict2 = createMockConflict({ id: "conflict-2", status: "pending" });

      await useMutationQueueStore.getState().addConflict(conflict1);
      await useMutationQueueStore.getState().addConflict(conflict2);

      expect(useMutationQueueStore.getState().getPendingConflictsCount()).toBe(2);
    });

    it("does not count resolved conflicts", async () => {
      const conflict = createMockConflict({ id: "conflict-1", status: "pending" });
      await useMutationQueueStore.getState().addConflict(conflict);

      expect(useMutationQueueStore.getState().getPendingConflictsCount()).toBe(1);

      await useMutationQueueStore.getState().resolveConflict("conflict-1", "keepLocal");

      expect(useMutationQueueStore.getState().getPendingConflictsCount()).toBe(0);
    });
  });

  describe("setSyncStatus", () => {
    it("updates sync status", () => {
      expect(useMutationQueueStore.getState().syncStatus).toBe("idle");

      useMutationQueueStore.getState().setSyncStatus("syncing");
      expect(useMutationQueueStore.getState().syncStatus).toBe("syncing");

      useMutationQueueStore.getState().setSyncStatus("error");
      expect(useMutationQueueStore.getState().syncStatus).toBe("error");

      useMutationQueueStore.getState().setSyncStatus("hasConflicts");
      expect(useMutationQueueStore.getState().syncStatus).toBe("hasConflicts");

      useMutationQueueStore.getState().setSyncStatus("idle");
      expect(useMutationQueueStore.getState().syncStatus).toBe("idle");
    });
  });

  describe("clearAll", () => {
    it("clears queue, conflicts, and resets sync status", async () => {
      const store = useMutationQueueStore.getState();
      const task = createMockTask();
      const conflict = createMockConflict();

      await store.addMutation(
        task.id,
        "updateTitle",
        { newTitle: "New Title" },
        task
      );
      await store.addConflict(conflict);

      expect(useMutationQueueStore.getState().queue).toHaveLength(1);
      expect(useMutationQueueStore.getState().conflicts).toHaveLength(1);
      expect(useMutationQueueStore.getState().syncStatus).toBe("hasConflicts");

      await useMutationQueueStore.getState().clearAll();

      const state = useMutationQueueStore.getState();
      expect(state.queue).toHaveLength(0);
      expect(state.conflicts).toHaveLength(0);
      expect(state.syncStatus).toBe("idle");
    });
  });

  describe("hydrate", () => {
    it("sets isHydrated to true after hydration", async () => {
      expect(useMutationQueueStore.getState().isHydrated).toBe(false);

      await useMutationQueueStore.getState().hydrate();

      expect(useMutationQueueStore.getState().isHydrated).toBe(true);
    });

    it("filters out resolved conflicts during hydration", async () => {
      const { getSyncConflicts } = await import("@/services/storage/asyncStorage");
      const pendingConflict = createMockConflict({ id: "pending-1", status: "pending" });
      const resolvedConflict = createMockConflict({
        id: "resolved-1",
        status: "resolved",
        resolution: "keepLocal",
      });

      vi.mocked(getSyncConflicts).mockResolvedValueOnce([
        pendingConflict,
        resolvedConflict,
      ]);

      await useMutationQueueStore.getState().hydrate();

      const state = useMutationQueueStore.getState();
      expect(state.conflicts).toHaveLength(1);
      expect(state.conflicts[0].id).toBe("pending-1");
    });

    it("sets hasConflicts status if pending conflicts exist", async () => {
      const { getSyncConflicts } = await import("@/services/storage/asyncStorage");
      const conflict = createMockConflict({ status: "pending" });

      vi.mocked(getSyncConflicts).mockResolvedValueOnce([conflict]);

      await useMutationQueueStore.getState().hydrate();

      expect(useMutationQueueStore.getState().syncStatus).toBe("hasConflicts");
    });

    it("sets idle status if no pending conflicts", async () => {
      const { getSyncConflicts } = await import("@/services/storage/asyncStorage");
      vi.mocked(getSyncConflicts).mockResolvedValueOnce([]);

      await useMutationQueueStore.getState().hydrate();

      expect(useMutationQueueStore.getState().syncStatus).toBe("idle");
    });
  });
});
