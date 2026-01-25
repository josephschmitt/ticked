import { describe, it, expect, beforeEach, vi, Mock } from "vitest";
import { getLocalTaskState } from "./syncManager";
import { useMutationQueueStore } from "@/stores/mutationQueueStore";
import { useTaskCacheStore } from "@/stores/taskCacheStore";
import type { Task, TaskStatus } from "@/types/task";
import type { PendingMutation } from "@/types/mutation";

// Mock the stores
vi.mock("@/stores/mutationQueueStore", () => ({
  useMutationQueueStore: {
    getState: vi.fn(),
    setState: vi.fn(),
  },
}));

vi.mock("@/stores/taskCacheStore", () => ({
  useTaskCacheStore: {
    getState: vi.fn(),
    setState: vi.fn(),
  },
}));

// Mock Notion client
vi.mock("@/services/notion/client", () => ({
  getNotionClient: vi.fn().mockReturnValue({
    pages: {
      retrieve: vi.fn(),
    },
  }),
}));

// Mock config store
vi.mock("@/stores/configStore", () => ({
  useConfigStore: {
    getState: vi.fn().mockReturnValue({
      fieldMapping: {
        taskName: "title-prop-id",
        status: "status-prop-id",
        doDate: "do-date-prop-id",
        dueDate: "due-date-prop-id",
        completedDate: "completed-date-prop-id",
        taskType: "type-prop-id",
        project: "project-prop-id",
        url: "url-prop-id",
      },
    }),
  },
}));

// Mock AsyncStorage
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
    id: "task-123",
    title: "Test Task",
    status: defaultStatus,
    notionUrl: "https://notion.so/task-123",
    lastEditedTime: "2024-01-15T10:00:00.000Z",
    ...overrides,
  };
}

// Helper to create a mock mutation
function createMockMutation<T extends PendingMutation["type"]>(
  type: T,
  payload: PendingMutation<T>["payload"],
  originalTask: Task
): PendingMutation<T> {
  return {
    id: `mutation-${Date.now()}`,
    taskId: originalTask.id,
    type,
    payload,
    createdAt: new Date().toISOString(),
    retryCount: 0,
    originalTask,
  };
}

describe("getLocalTaskState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty object if task not in cache", () => {
    (useMutationQueueStore.getState as Mock).mockReturnValue({
      getMutationsForTask: () => [],
    });
    (useTaskCacheStore.getState as Mock).mockReturnValue({
      tasks: [],
    });

    const result = getLocalTaskState("non-existent-task");

    expect(result).toEqual({});
  });

  it("returns cached task when no pending mutations", () => {
    const cachedTask = createMockTask({ id: "task-1", title: "Cached Title" });

    (useMutationQueueStore.getState as Mock).mockReturnValue({
      getMutationsForTask: () => [],
    });
    (useTaskCacheStore.getState as Mock).mockReturnValue({
      tasks: [cachedTask],
    });

    const result = getLocalTaskState("task-1");

    expect(result).toEqual(cachedTask);
  });

  it("applies updateTitle mutation to cached task", () => {
    const cachedTask = createMockTask({ id: "task-1", title: "Original Title" });
    const mutation = createMockMutation(
      "updateTitle",
      { newTitle: "Updated Title" },
      cachedTask
    );

    (useMutationQueueStore.getState as Mock).mockReturnValue({
      getMutationsForTask: () => [mutation],
    });
    (useTaskCacheStore.getState as Mock).mockReturnValue({
      tasks: [cachedTask],
    });

    const result = getLocalTaskState("task-1");

    expect(result.title).toBe("Updated Title");
  });

  it("applies updateStatus mutation to cached task", () => {
    const cachedTask = createMockTask({ id: "task-1" });
    const newStatus: TaskStatus = {
      id: "status-done",
      name: "Done",
      color: "green",
      group: "complete",
    };
    const mutation = createMockMutation(
      "updateStatus",
      { newStatus },
      cachedTask
    );

    (useMutationQueueStore.getState as Mock).mockReturnValue({
      getMutationsForTask: () => [mutation],
    });
    (useTaskCacheStore.getState as Mock).mockReturnValue({
      tasks: [cachedTask],
    });

    const result = getLocalTaskState("task-1");

    expect(result.status).toEqual(newStatus);
  });

  it("applies updateCheckbox mutation (checked) to cached task", () => {
    const cachedTask = createMockTask({ id: "task-1" });
    const mutation = createMockMutation(
      "updateCheckbox",
      { checked: true },
      cachedTask
    );

    (useMutationQueueStore.getState as Mock).mockReturnValue({
      getMutationsForTask: () => [mutation],
    });
    (useTaskCacheStore.getState as Mock).mockReturnValue({
      tasks: [cachedTask],
    });

    const result = getLocalTaskState("task-1");

    expect(result.status?.group).toBe("complete");
    expect(result.status?.name).toBe("Complete");
  });

  it("applies updateCheckbox mutation (unchecked) to cached task", () => {
    const doneStatus: TaskStatus = {
      id: "status-done",
      name: "Done",
      color: "green",
      group: "complete",
    };
    const cachedTask = createMockTask({ id: "task-1", status: doneStatus });
    const mutation = createMockMutation(
      "updateCheckbox",
      { checked: false },
      cachedTask
    );

    (useMutationQueueStore.getState as Mock).mockReturnValue({
      getMutationsForTask: () => [mutation],
    });
    (useTaskCacheStore.getState as Mock).mockReturnValue({
      tasks: [cachedTask],
    });

    const result = getLocalTaskState("task-1");

    expect(result.status?.group).toBe("todo");
    expect(result.status?.name).toBe("To Do");
  });

  it("applies updateDoDate mutation to cached task", () => {
    const cachedTask = createMockTask({ id: "task-1", doDate: "2024-01-15" });
    const mutation = createMockMutation(
      "updateDoDate",
      { date: "2024-01-20" },
      cachedTask
    );

    (useMutationQueueStore.getState as Mock).mockReturnValue({
      getMutationsForTask: () => [mutation],
    });
    (useTaskCacheStore.getState as Mock).mockReturnValue({
      tasks: [cachedTask],
    });

    const result = getLocalTaskState("task-1");

    expect(result.doDate).toBe("2024-01-20");
  });

  it("applies updateDoDate mutation with null to cached task", () => {
    const cachedTask = createMockTask({ id: "task-1", doDate: "2024-01-15" });
    const mutation = createMockMutation(
      "updateDoDate",
      { date: null },
      cachedTask
    );

    (useMutationQueueStore.getState as Mock).mockReturnValue({
      getMutationsForTask: () => [mutation],
    });
    (useTaskCacheStore.getState as Mock).mockReturnValue({
      tasks: [cachedTask],
    });

    const result = getLocalTaskState("task-1");

    expect(result.doDate).toBeUndefined();
  });

  it("applies updateDueDate mutation to cached task", () => {
    const cachedTask = createMockTask({ id: "task-1", dueDate: "2024-01-20" });
    const mutation = createMockMutation(
      "updateDueDate",
      { date: "2024-01-25" },
      cachedTask
    );

    (useMutationQueueStore.getState as Mock).mockReturnValue({
      getMutationsForTask: () => [mutation],
    });
    (useTaskCacheStore.getState as Mock).mockReturnValue({
      tasks: [cachedTask],
    });

    const result = getLocalTaskState("task-1");

    expect(result.dueDate).toBe("2024-01-25");
  });

  it("applies updateCompletedDate mutation to cached task", () => {
    const cachedTask = createMockTask({ id: "task-1" });
    const mutation = createMockMutation(
      "updateCompletedDate",
      { date: "2024-01-15" },
      cachedTask
    );

    (useMutationQueueStore.getState as Mock).mockReturnValue({
      getMutationsForTask: () => [mutation],
    });
    (useTaskCacheStore.getState as Mock).mockReturnValue({
      tasks: [cachedTask],
    });

    const result = getLocalTaskState("task-1");

    expect(result.completedDate).toBe("2024-01-15");
  });

  it("applies updateTaskType mutation to cached task", () => {
    const cachedTask = createMockTask({ id: "task-1", taskType: "Feature" });
    const mutation = createMockMutation(
      "updateTaskType",
      { optionName: "Bug" },
      cachedTask
    );

    (useMutationQueueStore.getState as Mock).mockReturnValue({
      getMutationsForTask: () => [mutation],
    });
    (useTaskCacheStore.getState as Mock).mockReturnValue({
      tasks: [cachedTask],
    });

    const result = getLocalTaskState("task-1");

    expect(result.taskType).toBe("Bug");
  });

  it("applies updateProject mutation to cached task", () => {
    const cachedTask = createMockTask({ id: "task-1", project: "Project A" });
    const mutation = createMockMutation(
      "updateProject",
      { optionName: "Project B" },
      cachedTask
    );

    (useMutationQueueStore.getState as Mock).mockReturnValue({
      getMutationsForTask: () => [mutation],
    });
    (useTaskCacheStore.getState as Mock).mockReturnValue({
      tasks: [cachedTask],
    });

    const result = getLocalTaskState("task-1");

    expect(result.project).toBe("Project B");
  });

  it("applies updateUrl mutation to cached task", () => {
    const cachedTask = createMockTask({ id: "task-1", url: "https://old.com" });
    const mutation = createMockMutation(
      "updateUrl",
      { url: "https://new.com" },
      cachedTask
    );

    (useMutationQueueStore.getState as Mock).mockReturnValue({
      getMutationsForTask: () => [mutation],
    });
    (useTaskCacheStore.getState as Mock).mockReturnValue({
      tasks: [cachedTask],
    });

    const result = getLocalTaskState("task-1");

    expect(result.url).toBe("https://new.com");
  });

  it("applies updateUrl mutation with null to cached task", () => {
    const cachedTask = createMockTask({ id: "task-1", url: "https://old.com" });
    const mutation = createMockMutation(
      "updateUrl",
      { url: null },
      cachedTask
    );

    (useMutationQueueStore.getState as Mock).mockReturnValue({
      getMutationsForTask: () => [mutation],
    });
    (useTaskCacheStore.getState as Mock).mockReturnValue({
      tasks: [cachedTask],
    });

    const result = getLocalTaskState("task-1");

    expect(result.url).toBeUndefined();
  });

  it("applies multiple mutations in order", () => {
    const cachedTask = createMockTask({
      id: "task-1",
      title: "Original",
      doDate: "2024-01-15",
    });

    const titleMutation = createMockMutation(
      "updateTitle",
      { newTitle: "Updated" },
      cachedTask
    );
    const dateMutation = createMockMutation(
      "updateDoDate",
      { date: "2024-01-20" },
      cachedTask
    );
    const statusMutation = createMockMutation(
      "updateStatus",
      {
        newStatus: {
          id: "status-done",
          name: "Done",
          color: "green",
          group: "complete",
        },
      },
      cachedTask
    );

    (useMutationQueueStore.getState as Mock).mockReturnValue({
      getMutationsForTask: () => [titleMutation, dateMutation, statusMutation],
    });
    (useTaskCacheStore.getState as Mock).mockReturnValue({
      tasks: [cachedTask],
    });

    const result = getLocalTaskState("task-1");

    expect(result.title).toBe("Updated");
    expect(result.doDate).toBe("2024-01-20");
    expect(result.status?.group).toBe("complete");
  });

  it("last mutation wins for same field", () => {
    const cachedTask = createMockTask({ id: "task-1", title: "Original" });

    const firstMutation = createMockMutation(
      "updateTitle",
      { newTitle: "First Update" },
      cachedTask
    );
    const secondMutation = createMockMutation(
      "updateTitle",
      { newTitle: "Second Update" },
      cachedTask
    );

    (useMutationQueueStore.getState as Mock).mockReturnValue({
      getMutationsForTask: () => [firstMutation, secondMutation],
    });
    (useTaskCacheStore.getState as Mock).mockReturnValue({
      tasks: [cachedTask],
    });

    const result = getLocalTaskState("task-1");

    expect(result.title).toBe("Second Update");
  });

  it("preserves original task fields not affected by mutations", () => {
    const cachedTask = createMockTask({
      id: "task-1",
      title: "Original Title",
      project: "My Project",
      taskType: "Feature",
      notionUrl: "https://notion.so/page",
    });

    const titleMutation = createMockMutation(
      "updateTitle",
      { newTitle: "New Title" },
      cachedTask
    );

    (useMutationQueueStore.getState as Mock).mockReturnValue({
      getMutationsForTask: () => [titleMutation],
    });
    (useTaskCacheStore.getState as Mock).mockReturnValue({
      tasks: [cachedTask],
    });

    const result = getLocalTaskState("task-1");

    expect(result.title).toBe("New Title");
    expect(result.project).toBe("My Project");
    expect(result.taskType).toBe("Feature");
    expect(result.notionUrl).toBe("https://notion.so/page");
  });
});
