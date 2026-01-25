import { describe, it, expect } from "vitest";
import {
  hasConflict,
  createConflict,
  canAutoResolve,
  getConflictDescription,
} from "./conflictDetection";
import type { Task, TaskStatus } from "@/types/task";
import type { PendingMutation, SyncConflict } from "@/types/mutation";

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
    id: "mutation-1",
    taskId: originalTask.id,
    type,
    payload,
    createdAt: new Date().toISOString(),
    retryCount: 0,
    originalTask,
  };
}

describe("hasConflict", () => {
  it("returns true when server task was edited after mutation was created", () => {
    const originalTask = createMockTask({
      lastEditedTime: "2024-01-15T10:00:00.000Z",
    });
    const serverTask = createMockTask({
      lastEditedTime: "2024-01-15T11:00:00.000Z", // 1 hour later
    });
    const mutation = createMockMutation(
      "updateTitle",
      { newTitle: "New Title" },
      originalTask
    );

    expect(hasConflict(mutation, serverTask)).toBe(true);
  });

  it("returns false when server task was not edited after mutation was created", () => {
    const originalTask = createMockTask({
      lastEditedTime: "2024-01-15T10:00:00.000Z",
    });
    const serverTask = createMockTask({
      lastEditedTime: "2024-01-15T10:00:00.000Z", // Same time
    });
    const mutation = createMockMutation(
      "updateTitle",
      { newTitle: "New Title" },
      originalTask
    );

    expect(hasConflict(mutation, serverTask)).toBe(false);
  });

  it("returns false when server task was edited before mutation was created", () => {
    const originalTask = createMockTask({
      lastEditedTime: "2024-01-15T10:00:00.000Z",
    });
    const serverTask = createMockTask({
      lastEditedTime: "2024-01-15T09:00:00.000Z", // 1 hour before
    });
    const mutation = createMockMutation(
      "updateTitle",
      { newTitle: "New Title" },
      originalTask
    );

    expect(hasConflict(mutation, serverTask)).toBe(false);
  });

  it("handles edge case of 1 millisecond difference", () => {
    const originalTask = createMockTask({
      lastEditedTime: "2024-01-15T10:00:00.000Z",
    });
    const serverTask = createMockTask({
      lastEditedTime: "2024-01-15T10:00:00.001Z", // 1ms later
    });
    const mutation = createMockMutation(
      "updateTitle",
      { newTitle: "New Title" },
      originalTask
    );

    expect(hasConflict(mutation, serverTask)).toBe(true);
  });
});

describe("createConflict", () => {
  it("creates a valid conflict object", () => {
    const originalTask = createMockTask();
    const serverTask = createMockTask({
      lastEditedTime: "2024-01-15T11:00:00.000Z",
    });
    const mutation = createMockMutation(
      "updateTitle",
      { newTitle: "New Title" },
      originalTask
    );

    const conflict = createConflict(mutation, serverTask);

    expect(conflict.id).toMatch(/^conflict-\d+-[a-z0-9]+$/);
    expect(conflict.mutation).toBe(mutation);
    expect(conflict.serverTask).toBe(serverTask);
    expect(conflict.status).toBe("pending");
    expect(conflict.detectedAt).toBeDefined();
    expect(new Date(conflict.detectedAt).getTime()).toBeLessThanOrEqual(
      Date.now()
    );
  });

  it("generates unique conflict IDs", () => {
    const originalTask = createMockTask();
    const serverTask = createMockTask();
    const mutation = createMockMutation(
      "updateTitle",
      { newTitle: "New Title" },
      originalTask
    );

    const conflict1 = createConflict(mutation, serverTask);
    const conflict2 = createConflict(mutation, serverTask);

    expect(conflict1.id).not.toBe(conflict2.id);
  });
});

describe("canAutoResolve", () => {
  describe("updateStatus mutation", () => {
    it("returns true when server status unchanged", () => {
      const status: TaskStatus = {
        id: "status-1",
        name: "To Do",
        color: "default",
        group: "todo",
      };
      const originalTask = createMockTask({ status });
      const serverTask = createMockTask({ status }); // Same status
      const mutation = createMockMutation(
        "updateStatus",
        {
          newStatus: {
            id: "status-2",
            name: "Done",
            color: "green",
            group: "complete",
          },
        },
        originalTask
      );

      expect(canAutoResolve(mutation, serverTask)).toBe(true);
    });

    it("returns false when server status changed", () => {
      const originalStatus: TaskStatus = {
        id: "status-1",
        name: "To Do",
        color: "default",
        group: "todo",
      };
      const serverStatus: TaskStatus = {
        id: "status-3",
        name: "In Progress",
        color: "blue",
        group: "doing",
      };
      const originalTask = createMockTask({ status: originalStatus });
      const serverTask = createMockTask({ status: serverStatus });
      const mutation = createMockMutation(
        "updateStatus",
        {
          newStatus: {
            id: "status-2",
            name: "Done",
            color: "green",
            group: "complete",
          },
        },
        originalTask
      );

      expect(canAutoResolve(mutation, serverTask)).toBe(false);
    });
  });

  describe("updateTitle mutation", () => {
    it("returns true when server title unchanged", () => {
      const originalTask = createMockTask({ title: "Original Title" });
      const serverTask = createMockTask({ title: "Original Title" });
      const mutation = createMockMutation(
        "updateTitle",
        { newTitle: "New Title" },
        originalTask
      );

      expect(canAutoResolve(mutation, serverTask)).toBe(true);
    });

    it("returns false when server title changed", () => {
      const originalTask = createMockTask({ title: "Original Title" });
      const serverTask = createMockTask({ title: "Server Changed Title" });
      const mutation = createMockMutation(
        "updateTitle",
        { newTitle: "New Title" },
        originalTask
      );

      expect(canAutoResolve(mutation, serverTask)).toBe(false);
    });
  });

  describe("updateDoDate mutation", () => {
    it("returns true when server doDate unchanged", () => {
      const originalTask = createMockTask({ doDate: "2024-01-20" });
      const serverTask = createMockTask({ doDate: "2024-01-20" });
      const mutation = createMockMutation(
        "updateDoDate",
        { date: "2024-01-25" },
        originalTask
      );

      expect(canAutoResolve(mutation, serverTask)).toBe(true);
    });

    it("returns false when server doDate changed", () => {
      const originalTask = createMockTask({ doDate: "2024-01-20" });
      const serverTask = createMockTask({ doDate: "2024-01-22" });
      const mutation = createMockMutation(
        "updateDoDate",
        { date: "2024-01-25" },
        originalTask
      );

      expect(canAutoResolve(mutation, serverTask)).toBe(false);
    });

    it("handles null dates correctly", () => {
      const originalTask = createMockTask({ doDate: undefined });
      const serverTask = createMockTask({ doDate: undefined });
      const mutation = createMockMutation(
        "updateDoDate",
        { date: "2024-01-25" },
        originalTask
      );

      expect(canAutoResolve(mutation, serverTask)).toBe(true);
    });
  });

  describe("updateDueDate mutation", () => {
    it("returns true when server dueDate unchanged", () => {
      const originalTask = createMockTask({ dueDate: "2024-01-20" });
      const serverTask = createMockTask({ dueDate: "2024-01-20" });
      const mutation = createMockMutation(
        "updateDueDate",
        { date: "2024-01-25" },
        originalTask
      );

      expect(canAutoResolve(mutation, serverTask)).toBe(true);
    });

    it("returns false when server dueDate changed", () => {
      const originalTask = createMockTask({ dueDate: "2024-01-20" });
      const serverTask = createMockTask({ dueDate: "2024-01-22" });
      const mutation = createMockMutation(
        "updateDueDate",
        { date: "2024-01-25" },
        originalTask
      );

      expect(canAutoResolve(mutation, serverTask)).toBe(false);
    });
  });

  describe("updateCompletedDate mutation", () => {
    it("returns true when server completedDate unchanged", () => {
      const originalTask = createMockTask({ completedDate: "2024-01-15" });
      const serverTask = createMockTask({ completedDate: "2024-01-15" });
      const mutation = createMockMutation(
        "updateCompletedDate",
        { date: "2024-01-20" },
        originalTask
      );

      expect(canAutoResolve(mutation, serverTask)).toBe(true);
    });

    it("returns false when server completedDate changed", () => {
      const originalTask = createMockTask({ completedDate: "2024-01-15" });
      const serverTask = createMockTask({ completedDate: "2024-01-18" });
      const mutation = createMockMutation(
        "updateCompletedDate",
        { date: "2024-01-20" },
        originalTask
      );

      expect(canAutoResolve(mutation, serverTask)).toBe(false);
    });
  });

  describe("updateTaskType mutation", () => {
    it("returns true when server taskType unchanged", () => {
      const originalTask = createMockTask({ taskType: "Feature" });
      const serverTask = createMockTask({ taskType: "Feature" });
      const mutation = createMockMutation(
        "updateTaskType",
        { optionName: "Bug" },
        originalTask
      );

      expect(canAutoResolve(mutation, serverTask)).toBe(true);
    });

    it("returns false when server taskType changed", () => {
      const originalTask = createMockTask({ taskType: "Feature" });
      const serverTask = createMockTask({ taskType: "Chore" });
      const mutation = createMockMutation(
        "updateTaskType",
        { optionName: "Bug" },
        originalTask
      );

      expect(canAutoResolve(mutation, serverTask)).toBe(false);
    });
  });

  describe("updateProject mutation", () => {
    it("returns true when server project unchanged", () => {
      const originalTask = createMockTask({ project: "Project A" });
      const serverTask = createMockTask({ project: "Project A" });
      const mutation = createMockMutation(
        "updateProject",
        { optionName: "Project B" },
        originalTask
      );

      expect(canAutoResolve(mutation, serverTask)).toBe(true);
    });

    it("returns false when server project changed", () => {
      const originalTask = createMockTask({ project: "Project A" });
      const serverTask = createMockTask({ project: "Project C" });
      const mutation = createMockMutation(
        "updateProject",
        { optionName: "Project B" },
        originalTask
      );

      expect(canAutoResolve(mutation, serverTask)).toBe(false);
    });
  });

  describe("updateUrl mutation", () => {
    it("returns true when server url unchanged", () => {
      const originalTask = createMockTask({ url: "https://example.com/old" });
      const serverTask = createMockTask({ url: "https://example.com/old" });
      const mutation = createMockMutation(
        "updateUrl",
        { url: "https://example.com/new" },
        originalTask
      );

      expect(canAutoResolve(mutation, serverTask)).toBe(true);
    });

    it("returns false when server url changed", () => {
      const originalTask = createMockTask({ url: "https://example.com/old" });
      const serverTask = createMockTask({
        url: "https://example.com/server-changed",
      });
      const mutation = createMockMutation(
        "updateUrl",
        { url: "https://example.com/new" },
        originalTask
      );

      expect(canAutoResolve(mutation, serverTask)).toBe(false);
    });
  });

  describe("updateCheckbox mutation", () => {
    it("returns true when server status unchanged", () => {
      const status: TaskStatus = {
        id: "status-1",
        name: "To Do",
        color: "default",
        group: "todo",
      };
      const originalTask = createMockTask({ status });
      const serverTask = createMockTask({ status });
      const mutation = createMockMutation(
        "updateCheckbox",
        { checked: true },
        originalTask
      );

      expect(canAutoResolve(mutation, serverTask)).toBe(true);
    });

    it("returns false when server status changed", () => {
      const originalStatus: TaskStatus = {
        id: "status-1",
        name: "To Do",
        color: "default",
        group: "todo",
      };
      const serverStatus: TaskStatus = {
        id: "status-2",
        name: "Done",
        color: "green",
        group: "complete",
      };
      const originalTask = createMockTask({ status: originalStatus });
      const serverTask = createMockTask({ status: serverStatus });
      const mutation = createMockMutation(
        "updateCheckbox",
        { checked: true },
        originalTask
      );

      expect(canAutoResolve(mutation, serverTask)).toBe(false);
    });
  });
});

describe("getConflictDescription", () => {
  it("describes updateStatus conflict", () => {
    const originalTask = createMockTask();
    const serverTask = createMockTask({
      status: {
        id: "status-3",
        name: "In Progress",
        color: "blue",
        group: "doing",
      },
    });
    const mutation = createMockMutation(
      "updateStatus",
      {
        newStatus: {
          id: "status-2",
          name: "Done",
          color: "green",
          group: "complete",
        },
      },
      originalTask
    );
    const conflict: SyncConflict = {
      id: "conflict-1",
      mutation,
      serverTask,
      detectedAt: new Date().toISOString(),
      status: "pending",
    };

    const description = getConflictDescription(conflict);

    expect(description.localChange).toBe('Changed status to "Done"');
    expect(description.serverChange).toBe('Server status is now "In Progress"');
  });

  it("describes updateCheckbox conflict for completing task", () => {
    const originalTask = createMockTask();
    const serverTask = createMockTask({
      status: {
        id: "status-1",
        name: "To Do",
        color: "default",
        group: "todo",
      },
    });
    const mutation = createMockMutation(
      "updateCheckbox",
      { checked: true },
      originalTask
    );
    const conflict: SyncConflict = {
      id: "conflict-1",
      mutation,
      serverTask,
      detectedAt: new Date().toISOString(),
      status: "pending",
    };

    const description = getConflictDescription(conflict);

    expect(description.localChange).toBe("Completed task");
    expect(description.serverChange).toBe("Server shows task as incomplete");
  });

  it("describes updateCheckbox conflict for uncompleting task", () => {
    const originalTask = createMockTask();
    const serverTask = createMockTask({
      status: {
        id: "status-2",
        name: "Done",
        color: "green",
        group: "complete",
      },
    });
    const mutation = createMockMutation(
      "updateCheckbox",
      { checked: false },
      originalTask
    );
    const conflict: SyncConflict = {
      id: "conflict-1",
      mutation,
      serverTask,
      detectedAt: new Date().toISOString(),
      status: "pending",
    };

    const description = getConflictDescription(conflict);

    expect(description.localChange).toBe("Uncompleted task");
    expect(description.serverChange).toBe("Server shows task as completed");
  });

  it("describes updateTitle conflict", () => {
    const originalTask = createMockTask();
    const serverTask = createMockTask({ title: "Server Title" });
    const mutation = createMockMutation(
      "updateTitle",
      { newTitle: "My New Title" },
      originalTask
    );
    const conflict: SyncConflict = {
      id: "conflict-1",
      mutation,
      serverTask,
      detectedAt: new Date().toISOString(),
      status: "pending",
    };

    const description = getConflictDescription(conflict);

    expect(description.localChange).toBe('Changed title to "My New Title"');
    expect(description.serverChange).toBe('Server title is now "Server Title"');
  });

  it("describes updateDoDate conflict", () => {
    const originalTask = createMockTask();
    const serverTask = createMockTask({ doDate: "2024-01-25" });
    const mutation = createMockMutation(
      "updateDoDate",
      { date: "2024-01-20" },
      originalTask
    );
    const conflict: SyncConflict = {
      id: "conflict-1",
      mutation,
      serverTask,
      detectedAt: new Date().toISOString(),
      status: "pending",
    };

    const description = getConflictDescription(conflict);

    expect(description.localChange).toBe('Changed do date to "2024-01-20"');
    expect(description.serverChange).toBe('Server do date is now "2024-01-25"');
  });

  it("describes updateDoDate conflict with null date", () => {
    const originalTask = createMockTask();
    const serverTask = createMockTask({ doDate: "2024-01-25" });
    const mutation = createMockMutation(
      "updateDoDate",
      { date: null },
      originalTask
    );
    const conflict: SyncConflict = {
      id: "conflict-1",
      mutation,
      serverTask,
      detectedAt: new Date().toISOString(),
      status: "pending",
    };

    const description = getConflictDescription(conflict);

    expect(description.localChange).toBe('Changed do date to "none"');
    expect(description.serverChange).toBe('Server do date is now "2024-01-25"');
  });

  it("describes updateDueDate conflict", () => {
    const originalTask = createMockTask();
    const serverTask = createMockTask({ dueDate: "2024-02-01" });
    const mutation = createMockMutation(
      "updateDueDate",
      { date: "2024-01-30" },
      originalTask
    );
    const conflict: SyncConflict = {
      id: "conflict-1",
      mutation,
      serverTask,
      detectedAt: new Date().toISOString(),
      status: "pending",
    };

    const description = getConflictDescription(conflict);

    expect(description.localChange).toBe('Changed due date to "2024-01-30"');
    expect(description.serverChange).toBe('Server due date is now "2024-02-01"');
  });

  it("describes updateCompletedDate conflict", () => {
    const originalTask = createMockTask();
    const serverTask = createMockTask({ completedDate: "2024-01-18" });
    const mutation = createMockMutation(
      "updateCompletedDate",
      { date: "2024-01-15" },
      originalTask
    );
    const conflict: SyncConflict = {
      id: "conflict-1",
      mutation,
      serverTask,
      detectedAt: new Date().toISOString(),
      status: "pending",
    };

    const description = getConflictDescription(conflict);

    expect(description.localChange).toBe(
      'Changed completed date to "2024-01-15"'
    );
    expect(description.serverChange).toBe(
      'Server completed date is now "2024-01-18"'
    );
  });

  it("describes updateTaskType conflict", () => {
    const originalTask = createMockTask();
    const serverTask = createMockTask({ taskType: "Chore" });
    const mutation = createMockMutation(
      "updateTaskType",
      { optionName: "Bug" },
      originalTask
    );
    const conflict: SyncConflict = {
      id: "conflict-1",
      mutation,
      serverTask,
      detectedAt: new Date().toISOString(),
      status: "pending",
    };

    const description = getConflictDescription(conflict);

    expect(description.localChange).toBe('Changed type to "Bug"');
    expect(description.serverChange).toBe('Server type is now "Chore"');
  });

  it("describes updateProject conflict", () => {
    const originalTask = createMockTask();
    const serverTask = createMockTask({ project: "Project B" });
    const mutation = createMockMutation(
      "updateProject",
      { optionName: "Project A" },
      originalTask
    );
    const conflict: SyncConflict = {
      id: "conflict-1",
      mutation,
      serverTask,
      detectedAt: new Date().toISOString(),
      status: "pending",
    };

    const description = getConflictDescription(conflict);

    expect(description.localChange).toBe('Changed project to "Project A"');
    expect(description.serverChange).toBe('Server project is now "Project B"');
  });

  it("describes updateUrl conflict", () => {
    const originalTask = createMockTask();
    const serverTask = createMockTask({ url: "https://example.com/server" });
    const mutation = createMockMutation(
      "updateUrl",
      { url: "https://example.com/local" },
      originalTask
    );
    const conflict: SyncConflict = {
      id: "conflict-1",
      mutation,
      serverTask,
      detectedAt: new Date().toISOString(),
      status: "pending",
    };

    const description = getConflictDescription(conflict);

    expect(description.localChange).toBe(
      'Changed URL to "https://example.com/local"'
    );
    expect(description.serverChange).toBe(
      'Server URL is now "https://example.com/server"'
    );
  });

  it("describes updateUrl conflict with null values", () => {
    const originalTask = createMockTask();
    const serverTask = createMockTask({ url: undefined });
    const mutation = createMockMutation(
      "updateUrl",
      { url: null },
      originalTask
    );
    const conflict: SyncConflict = {
      id: "conflict-1",
      mutation,
      serverTask,
      detectedAt: new Date().toISOString(),
      status: "pending",
    };

    const description = getConflictDescription(conflict);

    expect(description.localChange).toBe('Changed URL to "none"');
    expect(description.serverChange).toBe('Server URL is now "none"');
  });
});
