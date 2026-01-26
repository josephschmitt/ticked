import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Task, TaskStatus } from "@/types/task";

// Mock all external dependencies before importing the module
const mockQueryClient = {
  setQueryData: vi.fn(),
  getQueryData: vi.fn(),
  cancelQueries: vi.fn().mockResolvedValue(undefined),
  invalidateQueries: vi.fn().mockResolvedValue(undefined),
};

vi.mock("@tanstack/react-query", () => ({
  useMutation: vi.fn((config) => {
    // Return a mock mutation that exposes the config for testing
    return {
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      isLoading: false,
      isError: false,
      isSuccess: false,
      _config: config, // Expose config for testing
    };
  }),
  useQueryClient: vi.fn(() => mockQueryClient),
}));

const mockConfigStore = {
  selectedDatabaseId: "db-123",
  fieldMapping: {
    taskName: "title-prop",
    status: "status-prop",
  },
};

vi.mock("@/stores/configStore", () => ({
  useConfigStore: vi.fn((selector) => selector(mockConfigStore)),
}));

const mockToastStore = {
  showToast: vi.fn(),
};

vi.mock("@/stores/toastStore", () => ({
  useToastStore: vi.fn((selector) => selector(mockToastStore)),
}));

const mockMutationQueueStore = {
  addMutation: vi.fn().mockResolvedValue("mutation-1"),
};

vi.mock("@/stores/mutationQueueStore", () => ({
  useMutationQueueStore: vi.fn((selector) => selector(mockMutationQueueStore)),
}));

const mockTaskCacheStore = {
  addTask: vi.fn().mockResolvedValue(undefined),
};

vi.mock("@/stores/taskCacheStore", () => ({
  useTaskCacheStore: vi.fn((selector) => selector(mockTaskCacheStore)),
}));

const mockNetworkStore = {
  isConnected: true,
};

vi.mock("@/stores/networkStore", () => ({
  useNetworkStore: {
    getState: () => mockNetworkStore,
  },
}));

const mockCreateTaskPage = vi.fn();

vi.mock("@/services/notion/operations/createPage", () => ({
  createTaskPage: (...args: unknown[]) => mockCreateTaskPage(...args),
}));

vi.mock("@/hooks/queries/useTasks", () => ({
  TASKS_QUERY_KEY: ["tasks"],
}));

// Import after mocks are set up
import { useCreateTask } from "./useCreateTask";
import { useMutation } from "@tanstack/react-query";

// Helper to create a test status
function createMockStatus(overrides: Partial<TaskStatus> = {}): TaskStatus {
  return {
    id: "status-1",
    name: "To Do",
    color: "default",
    group: "todo",
    ...overrides,
  };
}

// Helper to create a test task
function createMockTask(overrides: Partial<Task> = {}): Task {
  const defaultStatus = createMockStatus();
  return {
    id: `task-${Date.now()}`,
    title: "Test Task",
    status: defaultStatus,
    notionUrl: "https://notion.so/test",
    lastEditedTime: new Date().toISOString(),
    ...overrides,
  };
}

// Helper to get mutation config from the hook
function getMutationConfig() {
  useCreateTask();
  const mockUseMutation = useMutation as unknown as ReturnType<typeof vi.fn>;
  return mockUseMutation.mock.calls[mockUseMutation.mock.calls.length - 1][0];
}

describe("useCreateTask", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset network state to online
    mockNetworkStore.isConnected = true;
    // Reset config store
    mockConfigStore.selectedDatabaseId = "db-123";
    mockConfigStore.fieldMapping = {
      taskName: "title-prop",
      status: "status-prop",
    };
    // Reset query client mock
    mockQueryClient.getQueryData.mockReturnValue([]);
  });

  describe("mutationFn", () => {
    describe("online mode", () => {
      it("calls Notion API with correct parameters", async () => {
        const config = getMutationConfig();
        const status = createMockStatus();

        mockCreateTaskPage.mockResolvedValueOnce("page-123");

        await config.mutationFn({ title: "New Task", status });

        expect(mockCreateTaskPage).toHaveBeenCalledWith({
          dataSourceId: "db-123",
          titlePropertyId: "title-prop",
          title: "New Task",
          statusPropertyId: "status-prop",
          statusName: "To Do",
          isCheckboxStatus: false,
        });
      });

      it("handles checkbox status type correctly", async () => {
        const config = getMutationConfig();
        const checkboxStatus = createMockStatus({
          id: "checked",
          name: "Complete",
          group: "complete",
        });

        mockCreateTaskPage.mockResolvedValueOnce("page-123");

        await config.mutationFn({ title: "New Task", status: checkboxStatus });

        expect(mockCreateTaskPage).toHaveBeenCalledWith(
          expect.objectContaining({
            isCheckboxStatus: true,
          })
        );
      });

      it("handles unchecked checkbox status correctly", async () => {
        const config = getMutationConfig();
        const uncheckedStatus = createMockStatus({
          id: "unchecked",
          name: "To Do",
          group: "todo",
        });

        mockCreateTaskPage.mockResolvedValueOnce("page-123");

        await config.mutationFn({ title: "New Task", status: uncheckedStatus });

        expect(mockCreateTaskPage).toHaveBeenCalledWith(
          expect.objectContaining({
            isCheckboxStatus: true,
          })
        );
      });

      it("returns created task with real ID", async () => {
        const config = getMutationConfig();
        const status = createMockStatus();

        mockCreateTaskPage.mockResolvedValueOnce("real-page-id-123");

        const result = await config.mutationFn({ title: "New Task", status });

        expect(result.task.id).toBe("real-page-id-123");
        expect(result.task.title).toBe("New Task");
        expect(result.task.status).toEqual(status);
        expect(result.queued).toBe(false);
      });

      it("generates correct Notion URL from page ID", async () => {
        const config = getMutationConfig();
        const status = createMockStatus();

        mockCreateTaskPage.mockResolvedValueOnce("abc-123-def-456");

        const result = await config.mutationFn({ title: "New Task", status });

        expect(result.task.notionUrl).toBe("https://notion.so/abc123def456");
      });

      it("sets timestamps on created task", async () => {
        const config = getMutationConfig();
        const status = createMockStatus();
        const before = new Date().toISOString();

        mockCreateTaskPage.mockResolvedValueOnce("page-123");

        const result = await config.mutationFn({ title: "New Task", status });
        const after = new Date().toISOString();

        expect(result.task.lastEditedTime).toBeDefined();
        expect(result.task.creationDate).toBeDefined();
        expect(result.task.lastEditedTime! >= before).toBe(true);
        expect(result.task.lastEditedTime! <= after).toBe(true);
      });
    });

    describe("offline mode", () => {
      beforeEach(() => {
        mockNetworkStore.isConnected = false;
      });

      it("does not call Notion API when offline", async () => {
        const config = getMutationConfig();
        const status = createMockStatus();

        await config.mutationFn({ title: "Offline Task", status });

        expect(mockCreateTaskPage).not.toHaveBeenCalled();
      });

      it("returns queued: true when offline", async () => {
        const config = getMutationConfig();
        const status = createMockStatus();

        const result = await config.mutationFn({ title: "Offline Task", status });

        expect(result.queued).toBe(true);
        expect(result.task).toBeNull();
      });
    });

    describe("error handling", () => {
      it("throws error when database is not configured", async () => {
        mockConfigStore.selectedDatabaseId = null as unknown as string;
        const config = getMutationConfig();
        const status = createMockStatus();

        await expect(
          config.mutationFn({ title: "New Task", status })
        ).rejects.toThrow("Database not configured");
      });

      it("throws error when taskName field mapping is missing", async () => {
        mockConfigStore.fieldMapping = {
          status: "status-prop",
        } as typeof mockConfigStore.fieldMapping;
        const config = getMutationConfig();
        const status = createMockStatus();

        await expect(
          config.mutationFn({ title: "New Task", status })
        ).rejects.toThrow("Database not configured");
      });

      it("throws error when status field mapping is missing", async () => {
        mockConfigStore.fieldMapping = {
          taskName: "title-prop",
        } as typeof mockConfigStore.fieldMapping;
        const config = getMutationConfig();
        const status = createMockStatus();

        await expect(
          config.mutationFn({ title: "New Task", status })
        ).rejects.toThrow("Database not configured");
      });

      it("propagates API errors", async () => {
        const config = getMutationConfig();
        const status = createMockStatus();

        mockCreateTaskPage.mockRejectedValueOnce(new Error("Network Error"));

        await expect(
          config.mutationFn({ title: "New Task", status })
        ).rejects.toThrow("Network Error");
      });
    });
  });

  describe("onMutate (optimistic updates)", () => {
    it("cancels outgoing queries", async () => {
      const config = getMutationConfig();
      const status = createMockStatus();

      await config.onMutate({ title: "New Task", status });

      expect(mockQueryClient.cancelQueries).toHaveBeenCalledWith({
        queryKey: ["tasks", "db-123"],
      });
    });

    it("snapshots previous tasks for rollback", async () => {
      const config = getMutationConfig();
      const status = createMockStatus();
      const existingTasks = [createMockTask({ id: "existing-1" })];

      mockQueryClient.getQueryData.mockReturnValueOnce(existingTasks);

      const context = await config.onMutate({ title: "New Task", status });

      expect(context.previousTasks).toEqual(existingTasks);
    });

    it("generates temp ID with correct format", async () => {
      const config = getMutationConfig();
      const status = createMockStatus();

      const context = await config.onMutate({ title: "New Task", status });

      expect(context.tempId).toMatch(/^temp-\d+-[a-z0-9]{9}$/);
    });

    it("creates optimistic task with correct properties", async () => {
      const config = getMutationConfig();
      const status = createMockStatus({
        id: "in-progress",
        name: "In Progress",
        color: "blue",
      });

      const context = await config.onMutate({ title: "My New Task", status });

      expect(context.optimisticTask.title).toBe("My New Task");
      expect(context.optimisticTask.status).toEqual(status);
      expect(context.optimisticTask.notionUrl).toBe("");
      expect(context.optimisticTask.id).toMatch(/^temp-/);
      expect(context.optimisticTask.lastEditedTime).toBeDefined();
      expect(context.optimisticTask.creationDate).toBeDefined();
    });

    it("adds optimistic task to query cache", async () => {
      const config = getMutationConfig();
      const status = createMockStatus();
      const existingTasks = [createMockTask({ id: "existing-1" })];

      mockQueryClient.getQueryData.mockReturnValueOnce(existingTasks);

      await config.onMutate({ title: "New Task", status });

      expect(mockQueryClient.setQueryData).toHaveBeenCalled();
      const setQueryDataCall = mockQueryClient.setQueryData.mock.calls[0];
      expect(setQueryDataCall[0]).toEqual(["tasks", "db-123"]);

      // Call the updater function to verify it adds task at beginning
      const updater = setQueryDataCall[1];
      const result = updater(existingTasks);
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe("New Task");
      expect(result[1].id).toBe("existing-1");
    });

    it("handles empty cache gracefully", async () => {
      const config = getMutationConfig();
      const status = createMockStatus();

      mockQueryClient.getQueryData.mockReturnValueOnce(undefined);

      await config.onMutate({ title: "New Task", status });

      const setQueryDataCall = mockQueryClient.setQueryData.mock.calls[0];
      const updater = setQueryDataCall[1];
      const result = updater(undefined);
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("New Task");
    });

    describe("offline mode", () => {
      beforeEach(() => {
        mockNetworkStore.isConnected = false;
      });

      it("queues mutation when offline", async () => {
        const config = getMutationConfig();
        const status = createMockStatus();

        await config.onMutate({ title: "Offline Task", status });

        expect(mockMutationQueueStore.addMutation).toHaveBeenCalledWith(
          expect.stringMatching(/^temp-/),
          "createTask",
          {
            title: "Offline Task",
            statusId: "status-1",
            statusName: "To Do",
          },
          expect.objectContaining({
            title: "Offline Task",
          })
        );
      });

      it("adds task to local cache when offline", async () => {
        const config = getMutationConfig();
        const status = createMockStatus();

        await config.onMutate({ title: "Offline Task", status });

        expect(mockTaskCacheStore.addTask).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "Offline Task",
            id: expect.stringMatching(/^temp-/),
          })
        );
      });

      it("returns isOffline: true in context", async () => {
        const config = getMutationConfig();
        const status = createMockStatus();

        const context = await config.onMutate({ title: "Offline Task", status });

        expect(context.isOffline).toBe(true);
      });
    });

    describe("online mode", () => {
      it("does not queue mutation when online", async () => {
        const config = getMutationConfig();
        const status = createMockStatus();

        await config.onMutate({ title: "Online Task", status });

        expect(mockMutationQueueStore.addMutation).not.toHaveBeenCalled();
      });

      it("does not add to local cache when online", async () => {
        const config = getMutationConfig();
        const status = createMockStatus();

        await config.onMutate({ title: "Online Task", status });

        expect(mockTaskCacheStore.addTask).not.toHaveBeenCalled();
      });

      it("returns isOffline: false in context", async () => {
        const config = getMutationConfig();
        const status = createMockStatus();

        const context = await config.onMutate({ title: "Online Task", status });

        expect(context.isOffline).toBe(false);
      });
    });
  });

  describe("onError (rollback)", () => {
    it("rolls back to previous tasks on error", () => {
      const config = getMutationConfig();
      const previousTasks = [createMockTask({ id: "existing-1" })];
      const context = { previousTasks, tempId: "temp-123" };

      config.onError(new Error("API Error"), {}, context);

      expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(
        ["tasks", "db-123"],
        previousTasks
      );
    });

    it("shows error toast on failure", () => {
      const config = getMutationConfig();
      const context = { previousTasks: [], tempId: "temp-123" };

      config.onError(new Error("API Error"), {}, context);

      expect(mockToastStore.showToast).toHaveBeenCalledWith(
        "Failed to create task",
        "error"
      );
    });

    it("handles missing context gracefully", () => {
      const config = getMutationConfig();

      // Should not throw
      config.onError(new Error("API Error"), {}, undefined);

      expect(mockToastStore.showToast).toHaveBeenCalledWith(
        "Failed to create task",
        "error"
      );
    });

    it("logs error to console", () => {
      const config = getMutationConfig();
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const error = new Error("API Error");

      config.onError(error, {}, undefined);

      expect(consoleSpy).toHaveBeenCalledWith("Failed to create task:", error);
      consoleSpy.mockRestore();
    });
  });

  describe("onSuccess", () => {
    it("replaces temp task with real task in cache after online success", async () => {
      const config = getMutationConfig();
      const status = createMockStatus();
      const existingTasks = [
        { id: "temp-123", title: "New Task", status, notionUrl: "" },
      ];
      const realTask = {
        id: "real-page-id",
        title: "New Task",
        status,
        notionUrl: "https://notion.so/realpageid",
        lastEditedTime: new Date().toISOString(),
        creationDate: new Date().toISOString(),
      };

      mockQueryClient.getQueryData.mockReturnValue(existingTasks);

      await config.onSuccess(
        { task: realTask, queued: false },
        {},
        { tempId: "temp-123" }
      );

      expect(mockQueryClient.setQueryData).toHaveBeenCalled();
      const call = mockQueryClient.setQueryData.mock.calls[0];
      expect(call[0]).toEqual(["tasks", "db-123"]);

      // Verify the updater replaces the temp task
      const updater = call[1];
      const result = updater(existingTasks);
      expect(result[0].id).toBe("real-page-id");
    });

    it("persists real task to local cache after online success", async () => {
      const config = getMutationConfig();
      const realTask = createMockTask({ id: "real-page-id" });

      await config.onSuccess(
        { task: realTask, queued: false },
        {},
        { tempId: "temp-123" }
      );

      expect(mockTaskCacheStore.addTask).toHaveBeenCalledWith(realTask);
    });

    it("does not update cache when queued (offline)", async () => {
      const config = getMutationConfig();

      await config.onSuccess(
        { task: null, queued: true },
        {},
        { tempId: "temp-123" }
      );

      // setQueryData should not be called in onSuccess for queued mutations
      // (it was already called in onMutate)
      expect(mockQueryClient.setQueryData).not.toHaveBeenCalled();
    });

    it("does not persist to local cache when queued (offline)", async () => {
      const config = getMutationConfig();

      await config.onSuccess(
        { task: null, queued: true },
        {},
        { tempId: "temp-123" }
      );

      // addTask was already called in onMutate for offline mode
      expect(mockTaskCacheStore.addTask).not.toHaveBeenCalled();
    });

    it("handles missing context gracefully", async () => {
      const config = getMutationConfig();
      const realTask = createMockTask({ id: "real-page-id" });

      // Should not throw
      await config.onSuccess({ task: realTask, queued: false }, {}, undefined);
    });
  });

  describe("onSettled", () => {
    it("invalidates queries after online success", () => {
      const config = getMutationConfig();

      config.onSettled({ task: createMockTask(), queued: false });

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ["tasks", "db-123"],
      });
    });

    it("does not invalidate queries when queued (offline)", () => {
      const config = getMutationConfig();

      config.onSettled({ task: null, queued: true });

      expect(mockQueryClient.invalidateQueries).not.toHaveBeenCalled();
    });

    it("handles undefined data gracefully by invalidating", () => {
      const config = getMutationConfig();

      // Should not throw, and should invalidate to be safe
      config.onSettled(undefined);

      // When data is undefined, we err on the side of caution and refresh
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ["tasks", "db-123"],
      });
    });
  });

  describe("temp ID uniqueness", () => {
    it("generates unique temp IDs across multiple calls", async () => {
      const config = getMutationConfig();
      const status = createMockStatus();

      const context1 = await config.onMutate({ title: "Task 1", status });
      const context2 = await config.onMutate({ title: "Task 2", status });
      const context3 = await config.onMutate({ title: "Task 3", status });

      const tempIds = [context1.tempId, context2.tempId, context3.tempId];
      const uniqueIds = new Set(tempIds);

      expect(uniqueIds.size).toBe(3);
    });
  });

  describe("cache helper functions", () => {
    it("addTaskToCache handles null oldTasks", async () => {
      const config = getMutationConfig();
      const status = createMockStatus();

      mockQueryClient.getQueryData.mockReturnValueOnce(null);

      await config.onMutate({ title: "New Task", status });

      const call = mockQueryClient.setQueryData.mock.calls[0];
      const updater = call[1];
      const result = updater(null);

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("New Task");
    });

    it("replaceTaskIdInCache handles null oldTasks", async () => {
      const config = getMutationConfig();
      const realTask = createMockTask({ id: "real-id" });

      await config.onSuccess(
        { task: realTask, queued: false },
        {},
        { tempId: "temp-123" }
      );

      const call = mockQueryClient.setQueryData.mock.calls[0];
      const updater = call[1];
      const result = updater(null);

      expect(result).toBeNull();
    });

    it("replaceTaskIdInCache only replaces matching temp ID", async () => {
      const config = getMutationConfig();
      const status = createMockStatus();
      const existingTasks = [
        { id: "temp-123", title: "Task 1", status, notionUrl: "" },
        { id: "temp-456", title: "Task 2", status, notionUrl: "" },
        { id: "real-789", title: "Task 3", status, notionUrl: "https://notion.so/real" },
      ];
      const realTask = createMockTask({ id: "real-new", title: "Task 1" });

      await config.onSuccess(
        { task: realTask, queued: false },
        {},
        { tempId: "temp-123" }
      );

      const call = mockQueryClient.setQueryData.mock.calls[0];
      const updater = call[1];
      const result = updater(existingTasks);

      expect(result[0].id).toBe("real-new");
      expect(result[1].id).toBe("temp-456");
      expect(result[2].id).toBe("real-789");
    });
  });
});
