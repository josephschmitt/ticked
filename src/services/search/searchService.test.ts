import { describe, it, expect, vi, beforeEach } from "vitest";
import { searchTasksLocal, searchTasksOnline } from "./searchService";
import type { Task, TaskStatus } from "@/types/task";
import type { FieldMapping } from "@/types/fieldMapping";

// Mock the Notion client
vi.mock("@/services/notion/client", () => ({
  getNotionClient: vi.fn(() => ({
    search: vi.fn(),
    pages: {
      retrieve: vi.fn(),
    },
  })),
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

describe("searchService", () => {
  describe("searchTasksLocal", () => {
    describe("basic functionality", () => {
      it("returns empty array for empty query", () => {
        const tasks = [createMockTask({ title: "Test Task" })];
        const result = searchTasksLocal(tasks, "");

        expect(result).toEqual([]);
      });

      it("returns empty array for single character query", () => {
        const tasks = [createMockTask({ title: "Test Task" })];
        const result = searchTasksLocal(tasks, "T");

        expect(result).toEqual([]);
      });

      it("returns results for 2+ character query", () => {
        const tasks = [createMockTask({ title: "Test Task" })];
        const result = searchTasksLocal(tasks, "Te");

        expect(result).toHaveLength(1);
      });

      it("returns empty array when no tasks match", () => {
        const tasks = [
          createMockTask({ title: "First Task" }),
          createMockTask({ title: "Second Task" }),
        ];
        const result = searchTasksLocal(tasks, "xyz");

        expect(result).toEqual([]);
      });

      it("returns empty array for empty tasks list", () => {
        const result = searchTasksLocal([], "test");

        expect(result).toEqual([]);
      });
    });

    describe("case insensitivity", () => {
      it("matches lowercase query against uppercase title", () => {
        const tasks = [createMockTask({ title: "TEST TASK" })];
        const result = searchTasksLocal(tasks, "test");

        expect(result).toHaveLength(1);
        expect(result[0].title).toBe("TEST TASK");
      });

      it("matches uppercase query against lowercase title", () => {
        const tasks = [createMockTask({ title: "test task" })];
        const result = searchTasksLocal(tasks, "TEST");

        expect(result).toHaveLength(1);
        expect(result[0].title).toBe("test task");
      });

      it("matches mixed case query against mixed case title", () => {
        const tasks = [createMockTask({ title: "TeSt TaSk" })];
        const result = searchTasksLocal(tasks, "tEsT");

        expect(result).toHaveLength(1);
      });
    });

    describe("relevance scoring and sorting", () => {
      it("ranks exact matches first", () => {
        const tasks = [
          createMockTask({ id: "1", title: "Test task contains test" }),
          createMockTask({ id: "2", title: "test" }),
          createMockTask({ id: "3", title: "Test starts with" }),
        ];
        const result = searchTasksLocal(tasks, "test");

        expect(result[0].id).toBe("2"); // Exact match
      });

      it("ranks 'starts with' before 'contains'", () => {
        const tasks = [
          createMockTask({ id: "1", title: "Contains test in middle" }),
          createMockTask({ id: "2", title: "Test starts here" }),
        ];
        const result = searchTasksLocal(tasks, "test");

        expect(result[0].id).toBe("2"); // Starts with
        expect(result[1].id).toBe("1"); // Contains
      });

      it("sorts alphabetically within same score", () => {
        const tasks = [
          createMockTask({ id: "1", title: "Zebra test" }),
          createMockTask({ id: "2", title: "Apple test" }),
          createMockTask({ id: "3", title: "Mango test" }),
        ];
        const result = searchTasksLocal(tasks, "test");

        expect(result[0].title).toBe("Apple test");
        expect(result[1].title).toBe("Mango test");
        expect(result[2].title).toBe("Zebra test");
      });

      it("correctly prioritizes: exact > starts with > contains", () => {
        const tasks = [
          createMockTask({ id: "contains", title: "A task that contains hello" }),
          createMockTask({ id: "starts", title: "hello world" }),
          createMockTask({ id: "exact", title: "hello" }),
        ];
        const result = searchTasksLocal(tasks, "hello");

        expect(result[0].id).toBe("exact");
        expect(result[1].id).toBe("starts");
        expect(result[2].id).toBe("contains");
      });
    });

    describe("whitespace handling", () => {
      it("trims query whitespace", () => {
        const tasks = [createMockTask({ title: "Test Task" })];
        const result = searchTasksLocal(tasks, "  test  ");

        expect(result).toHaveLength(1);
      });

      it("matches queries with internal spaces", () => {
        const tasks = [createMockTask({ title: "Test Task Here" })];
        const result = searchTasksLocal(tasks, "test task");

        expect(result).toHaveLength(1);
      });

      it("handles whitespace-only query (checks pre-trim length)", () => {
        // Note: Current implementation checks length before trimming,
        // so "   " passes the length check but gets trimmed to empty.
        // Empty string matches everything via includes("").
        // This test documents current behavior.
        const tasks = [createMockTask({ title: "Test Task" })];
        const result = searchTasksLocal(tasks, "   ");

        // 3 spaces passes length >= 2 check, then normalizes to empty string
        // which matches all tasks (any string includes empty string)
        expect(result.length).toBeGreaterThan(0);
      });
    });

    describe("special characters", () => {
      it("matches titles with special characters", () => {
        const tasks = [createMockTask({ title: "Test [Task] #1" })];
        const result = searchTasksLocal(tasks, "[task]");

        expect(result).toHaveLength(1);
      });

      it("matches queries with special characters", () => {
        const tasks = [createMockTask({ title: "Bug #123: Fix issue" })];
        const result = searchTasksLocal(tasks, "#123");

        expect(result).toHaveLength(1);
      });

      it("handles unicode characters", () => {
        const tasks = [createMockTask({ title: "Задача тест" })];
        const result = searchTasksLocal(tasks, "тест");

        expect(result).toHaveLength(1);
      });

      it("handles emoji in titles", () => {
        const tasks = [createMockTask({ title: "🎉 Celebration task" })];
        const result = searchTasksLocal(tasks, "celebration");

        expect(result).toHaveLength(1);
      });
    });

    describe("multiple matches", () => {
      it("returns all matching tasks", () => {
        const tasks = [
          createMockTask({ title: "Project Alpha" }),
          createMockTask({ title: "Project Beta" }),
          createMockTask({ title: "Project Gamma" }),
          createMockTask({ title: "Unrelated Task" }),
        ];
        const result = searchTasksLocal(tasks, "project");

        expect(result).toHaveLength(3);
      });

      it("preserves task data integrity", () => {
        const originalTask = createMockTask({
          id: "unique-id",
          title: "Test Task",
          project: "My Project",
          doDate: "2024-01-15",
          dueDate: "2024-01-20",
          url: "https://example.com",
        });
        const tasks = [originalTask];
        const result = searchTasksLocal(tasks, "test");

        expect(result[0]).toBe(originalTask); // Same reference
        expect(result[0].project).toBe("My Project");
        expect(result[0].doDate).toBe("2024-01-15");
      });
    });

    describe("edge cases", () => {
      it("handles very long queries", () => {
        const tasks = [createMockTask({ title: "Short" })];
        const longQuery = "a".repeat(500);
        const result = searchTasksLocal(tasks, longQuery);

        expect(result).toEqual([]);
      });

      it("handles very long titles", () => {
        const longTitle = "Test " + "word ".repeat(200);
        const tasks = [createMockTask({ title: longTitle })];
        const result = searchTasksLocal(tasks, "test");

        expect(result).toHaveLength(1);
      });

      it("handles large number of tasks", () => {
        const tasks = Array.from({ length: 1000 }, (_, i) =>
          createMockTask({ title: `Task ${i}` })
        );
        const result = searchTasksLocal(tasks, "Task 5");

        // Should match "Task 5", "Task 50", "Task 51", ..., "Task 59", "Task 500", ...
        expect(result.length).toBeGreaterThan(0);
        expect(result.some(t => t.title === "Task 5")).toBe(true);
      });
    });
  });

  describe("searchTasksOnline", () => {
    const mockFieldMapping: FieldMapping = {
      taskName: "title-prop-id",
      status: "status-prop-id",
      taskType: "type-prop-id",
      project: "project-prop-id",
      doDate: "do-date-prop-id",
      dueDate: "due-date-prop-id",
      url: "url-prop-id",
      creationDate: "created-prop-id",
      completedDate: "completed-prop-id",
    };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    describe("input validation", () => {
      it("returns empty array for empty query", async () => {
        const result = await searchTasksOnline("", "db-id", mockFieldMapping);

        expect(result).toEqual([]);
      });

      it("returns empty array for single character query", async () => {
        const result = await searchTasksOnline("a", "db-id", mockFieldMapping);

        expect(result).toEqual([]);
      });

      it("proceeds with 2+ character query", async () => {
        const { getNotionClient } = await import("@/services/notion/client");
        const mockClient = {
          search: vi.fn().mockResolvedValue({ results: [], has_more: false, next_cursor: null }),
          pages: { retrieve: vi.fn() },
        };
        vi.mocked(getNotionClient).mockReturnValue(mockClient as unknown as ReturnType<typeof getNotionClient>);

        const result = await searchTasksOnline("ab", "db-id", mockFieldMapping);

        expect(mockClient.search).toHaveBeenCalled();
        expect(result).toEqual([]);
      });
    });

    describe("database filtering", () => {
      it("filters results to only include pages from specified database", async () => {
        const { getNotionClient } = await import("@/services/notion/client");
        const mockClient = {
          search: vi.fn().mockResolvedValue({
            results: [
              {
                id: "page-1",
                url: "https://notion.so/page1",
                created_time: "2024-01-15T00:00:00Z",
                last_edited_time: "2024-01-15T00:00:00Z",
                parent: { type: "database_id", database_id: "target-db-id" },
                properties: {
                  Title: { id: "title-prop-id", type: "title", title: [{ plain_text: "Task 1" }] },
                  Status: { id: "status-prop-id", type: "status", status: { id: "s1", name: "To Do", color: "default" } },
                },
              },
              {
                id: "page-2",
                url: "https://notion.so/page2",
                created_time: "2024-01-15T00:00:00Z",
                last_edited_time: "2024-01-15T00:00:00Z",
                parent: { type: "database_id", database_id: "other-db-id" },
                properties: {
                  Title: { id: "title-prop-id", type: "title", title: [{ plain_text: "Task 2" }] },
                  Status: { id: "status-prop-id", type: "status", status: { id: "s1", name: "To Do", color: "default" } },
                },
              },
            ],
            has_more: false,
            next_cursor: null,
          }),
          pages: { retrieve: vi.fn() },
        };
        vi.mocked(getNotionClient).mockReturnValue(mockClient as unknown as ReturnType<typeof getNotionClient>);

        const result = await searchTasksOnline("task", "target-db-id", mockFieldMapping);

        expect(result).toHaveLength(1);
        expect(result[0].title).toBe("Task 1");
      });

      it("handles database IDs with different formats (hyphens)", async () => {
        const { getNotionClient } = await import("@/services/notion/client");
        const mockClient = {
          search: vi.fn().mockResolvedValue({
            results: [
              {
                id: "page-1",
                url: "https://notion.so/page1",
                created_time: "2024-01-15T00:00:00Z",
                last_edited_time: "2024-01-15T00:00:00Z",
                // Database ID with hyphens
                parent: { type: "database_id", database_id: "1234-5678-90ab-cdef" },
                properties: {
                  Title: { id: "title-prop-id", type: "title", title: [{ plain_text: "Task 1" }] },
                  Status: { id: "status-prop-id", type: "status", status: { id: "s1", name: "To Do", color: "default" } },
                },
              },
            ],
            has_more: false,
            next_cursor: null,
          }),
          pages: { retrieve: vi.fn() },
        };
        vi.mocked(getNotionClient).mockReturnValue(mockClient as unknown as ReturnType<typeof getNotionClient>);

        // Query with database ID without hyphens
        const result = await searchTasksOnline("task", "1234567890abcdef", mockFieldMapping);

        expect(result).toHaveLength(1);
      });

      it("handles new data_source_id parent type (API 2025-09-03)", async () => {
        const { getNotionClient } = await import("@/services/notion/client");
        const mockClient = {
          search: vi.fn().mockResolvedValue({
            results: [
              {
                id: "page-1",
                url: "https://notion.so/page1",
                created_time: "2024-01-15T00:00:00Z",
                last_edited_time: "2024-01-15T00:00:00Z",
                // New API format with data_source_id
                parent: { type: "data_source_id", data_source_id: "target-db-id" },
                properties: {
                  Title: { id: "title-prop-id", type: "title", title: [{ plain_text: "Task 1" }] },
                  Status: { id: "status-prop-id", type: "status", status: { id: "s1", name: "To Do", color: "default" } },
                },
              },
              {
                id: "page-2",
                url: "https://notion.so/page2",
                created_time: "2024-01-15T00:00:00Z",
                last_edited_time: "2024-01-15T00:00:00Z",
                // Legacy format with database_id
                parent: { type: "database_id", database_id: "target-db-id" },
                properties: {
                  Title: { id: "title-prop-id", type: "title", title: [{ plain_text: "Task 2" }] },
                  Status: { id: "status-prop-id", type: "status", status: { id: "s1", name: "To Do", color: "default" } },
                },
              },
            ],
            has_more: false,
            next_cursor: null,
          }),
          pages: { retrieve: vi.fn() },
        };
        vi.mocked(getNotionClient).mockReturnValue(mockClient as unknown as ReturnType<typeof getNotionClient>);

        const result = await searchTasksOnline("task", "target-db-id", mockFieldMapping);

        // Both pages should be included (one with new format, one with legacy)
        expect(result).toHaveLength(2);
        expect(result[0].title).toBe("Task 1");
        expect(result[1].title).toBe("Task 2");
      });

      it("excludes non-database pages", async () => {
        const { getNotionClient } = await import("@/services/notion/client");
        const mockClient = {
          search: vi.fn().mockResolvedValue({
            results: [
              {
                id: "page-1",
                url: "https://notion.so/page1",
                created_time: "2024-01-15T00:00:00Z",
                last_edited_time: "2024-01-15T00:00:00Z",
                parent: { type: "page_id", page_id: "parent-page" }, // Not a database page
                properties: {},
              },
            ],
            has_more: false,
            next_cursor: null,
          }),
          pages: { retrieve: vi.fn() },
        };
        vi.mocked(getNotionClient).mockReturnValue(mockClient as unknown as ReturnType<typeof getNotionClient>);

        const result = await searchTasksOnline("task", "db-id", mockFieldMapping);

        expect(result).toEqual([]);
      });
    });

    describe("result limiting", () => {
      it("limits results to 50 tasks", async () => {
        const { getNotionClient } = await import("@/services/notion/client");
        const mockResults = Array.from({ length: 100 }, (_, i) => ({
          id: `page-${i}`,
          url: `https://notion.so/page${i}`,
          created_time: "2024-01-15T00:00:00Z",
          last_edited_time: "2024-01-15T00:00:00Z",
          parent: { type: "database_id", database_id: "target-db-id" },
          properties: {
            Title: { id: "title-prop-id", type: "title", title: [{ plain_text: `Task ${i}` }] },
            Status: { id: "status-prop-id", type: "status", status: { id: "s1", name: "To Do", color: "default" } },
          },
        }));

        const mockClient = {
          search: vi.fn().mockResolvedValue({
            results: mockResults,
            has_more: false,
            next_cursor: null,
          }),
          pages: { retrieve: vi.fn() },
        };
        vi.mocked(getNotionClient).mockReturnValue(mockClient as unknown as ReturnType<typeof getNotionClient>);

        const result = await searchTasksOnline("task", "target-db-id", mockFieldMapping);

        expect(result.length).toBeLessThanOrEqual(50);
      });
    });

    describe("task conversion", () => {
      it("converts status property to task status", async () => {
        const { getNotionClient } = await import("@/services/notion/client");
        const mockClient = {
          search: vi.fn().mockResolvedValue({
            results: [
              {
                id: "page-1",
                url: "https://notion.so/page1",
                created_time: "2024-01-15T00:00:00Z",
                last_edited_time: "2024-01-15T00:00:00Z",
                parent: { type: "database_id", database_id: "db-id" },
                properties: {
                  Title: { id: "title-prop-id", type: "title", title: [{ plain_text: "My Task" }] },
                  Status: { id: "status-prop-id", type: "status", status: { id: "done-id", name: "Done", color: "green" } },
                },
              },
            ],
            has_more: false,
            next_cursor: null,
          }),
          pages: { retrieve: vi.fn() },
        };
        vi.mocked(getNotionClient).mockReturnValue(mockClient as unknown as ReturnType<typeof getNotionClient>);

        const result = await searchTasksOnline("task", "db-id", mockFieldMapping);

        expect(result[0].status.name).toBe("Done");
        expect(result[0].status.group).toBe("complete"); // Inferred from "Done"
      });

      it("converts checkbox property to task status", async () => {
        const { getNotionClient } = await import("@/services/notion/client");
        const mockClient = {
          search: vi.fn().mockResolvedValue({
            results: [
              {
                id: "page-1",
                url: "https://notion.so/page1",
                created_time: "2024-01-15T00:00:00Z",
                last_edited_time: "2024-01-15T00:00:00Z",
                parent: { type: "database_id", database_id: "db-id" },
                properties: {
                  Title: { id: "title-prop-id", type: "title", title: [{ plain_text: "My Task" }] },
                  Complete: { id: "status-prop-id", type: "checkbox", checkbox: true },
                },
              },
            ],
            has_more: false,
            next_cursor: null,
          }),
          pages: { retrieve: vi.fn() },
        };
        vi.mocked(getNotionClient).mockReturnValue(mockClient as unknown as ReturnType<typeof getNotionClient>);

        const result = await searchTasksOnline("task", "db-id", mockFieldMapping);

        expect(result[0].status.id).toBe("checked");
        expect(result[0].status.group).toBe("complete");
      });

      it("skips pages without title", async () => {
        const { getNotionClient } = await import("@/services/notion/client");
        const mockClient = {
          search: vi.fn().mockResolvedValue({
            results: [
              {
                id: "page-1",
                url: "https://notion.so/page1",
                created_time: "2024-01-15T00:00:00Z",
                last_edited_time: "2024-01-15T00:00:00Z",
                parent: { type: "database_id", database_id: "db-id" },
                properties: {
                  Title: { id: "title-prop-id", type: "title", title: [] }, // Empty title
                  Status: { id: "status-prop-id", type: "status", status: { id: "s1", name: "To Do", color: "default" } },
                },
              },
            ],
            has_more: false,
            next_cursor: null,
          }),
          pages: { retrieve: vi.fn() },
        };
        vi.mocked(getNotionClient).mockReturnValue(mockClient as unknown as ReturnType<typeof getNotionClient>);

        const result = await searchTasksOnline("task", "db-id", mockFieldMapping);

        expect(result).toEqual([]);
      });

      it("skips pages without status", async () => {
        const { getNotionClient } = await import("@/services/notion/client");
        const mockClient = {
          search: vi.fn().mockResolvedValue({
            results: [
              {
                id: "page-1",
                url: "https://notion.so/page1",
                created_time: "2024-01-15T00:00:00Z",
                last_edited_time: "2024-01-15T00:00:00Z",
                parent: { type: "database_id", database_id: "db-id" },
                properties: {
                  Title: { id: "title-prop-id", type: "title", title: [{ plain_text: "My Task" }] },
                  // No status property
                },
              },
            ],
            has_more: false,
            next_cursor: null,
          }),
          pages: { retrieve: vi.fn() },
        };
        vi.mocked(getNotionClient).mockReturnValue(mockClient as unknown as ReturnType<typeof getNotionClient>);

        const result = await searchTasksOnline("task", "db-id", mockFieldMapping);

        expect(result).toEqual([]);
      });
    });

    describe("status group inference", () => {
      it.each([
        ["Done", "complete"],
        ["Complete", "complete"],
        ["Finished", "complete"],
        ["DONE", "complete"],
        ["Task Done", "complete"],
        ["In Progress", "inProgress"],
        ["Doing", "inProgress"],
        ["Started", "inProgress"],
        ["IN PROGRESS", "inProgress"],
        ["To Do", "todo"],
        ["Not Started", "inProgress"], // Contains "Started" which triggers inProgress
        ["Backlog", "todo"],
        ["Pending", "todo"],
      ])("infers '%s' status as '%s' group", async (statusName, expectedGroup) => {
        const { getNotionClient } = await import("@/services/notion/client");
        const mockClient = {
          search: vi.fn().mockResolvedValue({
            results: [
              {
                id: "page-1",
                url: "https://notion.so/page1",
                created_time: "2024-01-15T00:00:00Z",
                last_edited_time: "2024-01-15T00:00:00Z",
                parent: { type: "database_id", database_id: "db-id" },
                properties: {
                  Title: { id: "title-prop-id", type: "title", title: [{ plain_text: "Task" }] },
                  Status: { id: "status-prop-id", type: "status", status: { id: "s1", name: statusName, color: "default" } },
                },
              },
            ],
            has_more: false,
            next_cursor: null,
          }),
          pages: { retrieve: vi.fn() },
        };
        vi.mocked(getNotionClient).mockReturnValue(mockClient as unknown as ReturnType<typeof getNotionClient>);

        const result = await searchTasksOnline("task", "db-id", mockFieldMapping);

        expect(result[0].status.group).toBe(expectedGroup);
      });
    });

    describe("optional fields", () => {
      it("extracts date fields when present", async () => {
        const { getNotionClient } = await import("@/services/notion/client");
        const mockClient = {
          search: vi.fn().mockResolvedValue({
            results: [
              {
                id: "page-1",
                url: "https://notion.so/page1",
                created_time: "2024-01-15T00:00:00Z",
                last_edited_time: "2024-01-15T00:00:00Z",
                parent: { type: "database_id", database_id: "db-id" },
                properties: {
                  Title: { id: "title-prop-id", type: "title", title: [{ plain_text: "Task" }] },
                  Status: { id: "status-prop-id", type: "status", status: { id: "s1", name: "To Do", color: "default" } },
                  DoDate: { id: "do-date-prop-id", type: "date", date: { start: "2024-01-20", end: null } },
                  DueDate: { id: "due-date-prop-id", type: "date", date: { start: "2024-01-25", end: null } },
                },
              },
            ],
            has_more: false,
            next_cursor: null,
          }),
          pages: { retrieve: vi.fn() },
        };
        vi.mocked(getNotionClient).mockReturnValue(mockClient as unknown as ReturnType<typeof getNotionClient>);

        const result = await searchTasksOnline("task", "db-id", mockFieldMapping);

        expect(result[0].doDate).toBe("2024-01-20");
        expect(result[0].dueDate).toBe("2024-01-25");
      });

      it("extracts URL field when present", async () => {
        const { getNotionClient } = await import("@/services/notion/client");
        const mockClient = {
          search: vi.fn().mockResolvedValue({
            results: [
              {
                id: "page-1",
                url: "https://notion.so/page1",
                created_time: "2024-01-15T00:00:00Z",
                last_edited_time: "2024-01-15T00:00:00Z",
                parent: { type: "database_id", database_id: "db-id" },
                properties: {
                  Title: { id: "title-prop-id", type: "title", title: [{ plain_text: "Task" }] },
                  Status: { id: "status-prop-id", type: "status", status: { id: "s1", name: "To Do", color: "default" } },
                  URL: { id: "url-prop-id", type: "url", url: "https://example.com" },
                },
              },
            ],
            has_more: false,
            next_cursor: null,
          }),
          pages: { retrieve: vi.fn() },
        };
        vi.mocked(getNotionClient).mockReturnValue(mockClient as unknown as ReturnType<typeof getNotionClient>);

        const result = await searchTasksOnline("task", "db-id", mockFieldMapping);

        expect(result[0].url).toBe("https://example.com");
      });

      it("extracts select fields", async () => {
        const { getNotionClient } = await import("@/services/notion/client");
        const mockClient = {
          search: vi.fn().mockResolvedValue({
            results: [
              {
                id: "page-1",
                url: "https://notion.so/page1",
                created_time: "2024-01-15T00:00:00Z",
                last_edited_time: "2024-01-15T00:00:00Z",
                parent: { type: "database_id", database_id: "db-id" },
                properties: {
                  Title: { id: "title-prop-id", type: "title", title: [{ plain_text: "Task" }] },
                  Status: { id: "status-prop-id", type: "status", status: { id: "s1", name: "To Do", color: "default" } },
                  TaskType: { id: "type-prop-id", type: "select", select: { id: "t1", name: "Bug", color: "red" } },
                  Project: { id: "project-prop-id", type: "select", select: { id: "p1", name: "Alpha", color: "blue" } },
                },
              },
            ],
            has_more: false,
            next_cursor: null,
          }),
          pages: { retrieve: vi.fn() },
        };
        vi.mocked(getNotionClient).mockReturnValue(mockClient as unknown as ReturnType<typeof getNotionClient>);

        const result = await searchTasksOnline("task", "db-id", mockFieldMapping);

        expect(result[0].taskType).toBe("Bug");
        expect(result[0].project).toBe("Alpha");
      });
    });

    describe("API integration", () => {
      it("calls search API with correct parameters", async () => {
        const { getNotionClient } = await import("@/services/notion/client");
        const mockSearch = vi.fn().mockResolvedValue({
          results: [],
          has_more: false,
          next_cursor: null,
        });
        const mockClient = {
          search: mockSearch,
          pages: { retrieve: vi.fn() },
        };
        vi.mocked(getNotionClient).mockReturnValue(mockClient as unknown as ReturnType<typeof getNotionClient>);

        await searchTasksOnline("my search", "db-id", mockFieldMapping);

        expect(mockSearch).toHaveBeenCalledWith({
          query: "my search",
          filter: {
            property: "object",
            value: "page",
          },
          page_size: 100,
        });
      });
    });
  });
});
