import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Task, TaskStatus } from "@/types/task";
import type { FieldMapping } from "@/types/fieldMapping";

// Store mock values that we'll manipulate in tests
const mockAuthStore = {
  isAuthenticated: true,
};

const mockConfigStore = {
  selectedDatabaseId: "db-123",
  fieldMapping: {
    taskName: "title-prop-id",
    status: "status-prop-id",
  } as FieldMapping | null,
};

const mockNetworkState = {
  isOffline: false,
};

// Track calls to useQuery
let capturedQueryConfig: Record<string, unknown> | null = null;

// Mock all dependencies before importing the module
vi.mock("@/stores/authStore", () => ({
  useAuthStore: vi.fn((selector) => selector(mockAuthStore)),
}));

vi.mock("@/stores/configStore", () => ({
  useConfigStore: vi.fn((selector) => selector(mockConfigStore)),
}));

vi.mock("@/hooks/useNetworkState", () => ({
  useNetworkState: vi.fn(() => mockNetworkState),
}));

const mockSearchTasksOnline = vi.fn();

vi.mock("@/services/search/searchService", () => ({
  searchTasksOnline: (...args: unknown[]) => mockSearchTasksOnline(...args),
}));

// Mock React hooks used by useDebounce
vi.mock("react", async () => {
  const actual = await vi.importActual("react");
  return {
    ...actual,
    // Return the value immediately without debouncing for tests
    useState: vi.fn((initial) => [initial, vi.fn()]),
    useEffect: vi.fn(),
  };
});

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn((config) => {
    capturedQueryConfig = config;
    return {
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
      _config: config,
    };
  }),
}));

// Import after mocks
import { useSearchTasks, SEARCH_QUERY_KEY } from "./useSearchTasks";

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

// Helper to call the hook and get the captured query config
function getQueryConfig(query: string, mode: "online" | "local") {
  capturedQueryConfig = null;
  useSearchTasks(query, mode);
  return capturedQueryConfig!;
}

describe("useSearchTasks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedQueryConfig = null;

    // Reset mocks to defaults
    mockAuthStore.isAuthenticated = true;
    mockConfigStore.selectedDatabaseId = "db-123";
    mockConfigStore.fieldMapping = {
      taskName: "title-prop-id",
      status: "status-prop-id",
    } as FieldMapping;
    mockNetworkState.isOffline = false;
  });

  describe("SEARCH_QUERY_KEY", () => {
    it("exports correct base query key", () => {
      expect(SEARCH_QUERY_KEY).toEqual(["search"]);
    });
  });

  describe("query key", () => {
    it("includes base search key", () => {
      const config = getQueryConfig("test", "online");

      expect(config.queryKey[0]).toBe("search");
    });

    it("includes database ID in query key", () => {
      const config = getQueryConfig("test", "online");

      expect(config.queryKey).toContain("db-123");
    });

    it("includes search query in query key", () => {
      const config = getQueryConfig("my search", "online");

      // Query key uses the (mocked) debounced value which is same as input
      expect(config.queryKey).toContain("my search");
    });

    it("includes mode in query key", () => {
      const configOnline = getQueryConfig("test", "online");
      expect(configOnline.queryKey).toContain("online");

      const configLocal = getQueryConfig("test", "local");
      expect(configLocal.queryKey).toContain("local");
    });

    it("constructs full query key with correct structure", () => {
      const config = getQueryConfig("search term", "online");

      expect(config.queryKey).toEqual(["search", "db-123", "search term", "online"]);
    });

    it("uses different query keys for different databases", () => {
      mockConfigStore.selectedDatabaseId = "db-123";
      const config1 = getQueryConfig("test", "online");

      mockConfigStore.selectedDatabaseId = "db-456";
      const config2 = getQueryConfig("test", "online");

      expect(config1.queryKey[1]).toBe("db-123");
      expect(config2.queryKey[1]).toBe("db-456");
    });
  });

  describe("query enabling conditions", () => {
    describe("mode check", () => {
      it("enables query when mode is online", () => {
        const config = getQueryConfig("test query", "online");

        expect(config.enabled).toBe(true);
      });

      it("disables query when mode is local", () => {
        const config = getQueryConfig("test query", "local");

        expect(config.enabled).toBe(false);
      });
    });

    describe("query length check", () => {
      it("disables query for empty query string", () => {
        const config = getQueryConfig("", "online");

        expect(config.enabled).toBe(false);
      });

      it("disables query for single character", () => {
        const config = getQueryConfig("a", "online");

        expect(config.enabled).toBe(false);
      });

      it("enables query for 2 characters", () => {
        const config = getQueryConfig("ab", "online");

        expect(config.enabled).toBe(true);
      });

      it("enables query for longer strings", () => {
        const config = getQueryConfig("test query", "online");

        expect(config.enabled).toBe(true);
      });
    });

    describe("authentication check", () => {
      it("enables query when authenticated", () => {
        mockAuthStore.isAuthenticated = true;
        const config = getQueryConfig("test", "online");

        expect(config.enabled).toBe(true);
      });

      it("disables query when not authenticated", () => {
        mockAuthStore.isAuthenticated = false;
        const config = getQueryConfig("test", "online");

        expect(config.enabled).toBe(false);
      });
    });

    describe("database configuration check", () => {
      it("enables query when database is configured", () => {
        mockConfigStore.selectedDatabaseId = "db-123";
        const config = getQueryConfig("test", "online");

        expect(config.enabled).toBe(true);
      });

      it("disables query when database ID is null", () => {
        mockConfigStore.selectedDatabaseId = null as unknown as string;
        const config = getQueryConfig("test", "online");

        expect(config.enabled).toBe(false);
      });

      it("disables query when database ID is empty string", () => {
        mockConfigStore.selectedDatabaseId = "";
        const config = getQueryConfig("test", "online");

        expect(config.enabled).toBe(false);
      });
    });

    describe("field mapping check", () => {
      it("enables query when field mapping exists", () => {
        mockConfigStore.fieldMapping = { taskName: "id", status: "id" } as FieldMapping;
        const config = getQueryConfig("test", "online");

        expect(config.enabled).toBe(true);
      });

      it("disables query when field mapping is null", () => {
        mockConfigStore.fieldMapping = null;
        const config = getQueryConfig("test", "online");

        expect(config.enabled).toBe(false);
      });
    });

    describe("network check", () => {
      it("enables query when online", () => {
        mockNetworkState.isOffline = false;
        const config = getQueryConfig("test", "online");

        expect(config.enabled).toBe(true);
      });

      it("disables query when offline", () => {
        mockNetworkState.isOffline = true;
        const config = getQueryConfig("test", "online");

        expect(config.enabled).toBe(false);
      });
    });

    describe("combined conditions", () => {
      it("enables only when all conditions are met", () => {
        mockAuthStore.isAuthenticated = true;
        mockConfigStore.selectedDatabaseId = "db-123";
        mockConfigStore.fieldMapping = { taskName: "id", status: "id" } as FieldMapping;
        mockNetworkState.isOffline = false;

        const config = getQueryConfig("test", "online");
        expect(config.enabled).toBe(true);
      });

      it("disables when not authenticated", () => {
        mockAuthStore.isAuthenticated = false;
        mockConfigStore.selectedDatabaseId = "db-123";
        mockConfigStore.fieldMapping = { taskName: "id", status: "id" } as FieldMapping;
        mockNetworkState.isOffline = false;

        const config = getQueryConfig("test", "online");
        expect(config.enabled).toBe(false);
      });

      it("disables when no database configured", () => {
        mockAuthStore.isAuthenticated = true;
        mockConfigStore.selectedDatabaseId = "";
        mockConfigStore.fieldMapping = { taskName: "id", status: "id" } as FieldMapping;
        mockNetworkState.isOffline = false;

        const config = getQueryConfig("test", "online");
        expect(config.enabled).toBe(false);
      });

      it("disables when no field mapping", () => {
        mockAuthStore.isAuthenticated = true;
        mockConfigStore.selectedDatabaseId = "db-123";
        mockConfigStore.fieldMapping = null;
        mockNetworkState.isOffline = false;

        const config = getQueryConfig("test", "online");
        expect(config.enabled).toBe(false);
      });

      it("disables when offline", () => {
        mockAuthStore.isAuthenticated = true;
        mockConfigStore.selectedDatabaseId = "db-123";
        mockConfigStore.fieldMapping = { taskName: "id", status: "id" } as FieldMapping;
        mockNetworkState.isOffline = true;

        const config = getQueryConfig("test", "online");
        expect(config.enabled).toBe(false);
      });
    });
  });

  describe("queryFn", () => {
    it("calls searchTasksOnline with correct parameters", async () => {
      mockSearchTasksOnline.mockResolvedValue([]);

      const config = getQueryConfig("my query", "online");
      await config.queryFn();

      expect(mockSearchTasksOnline).toHaveBeenCalledWith(
        "my query", // debounced query (same as input in our mock)
        "db-123",
        mockConfigStore.fieldMapping
      );
    });

    it("returns results from searchTasksOnline", async () => {
      const mockTasks = [
        createMockTask({ title: "Task 1" }),
        createMockTask({ title: "Task 2" }),
      ];
      mockSearchTasksOnline.mockResolvedValue(mockTasks);

      const config = getQueryConfig("test", "online");
      const result = await config.queryFn();

      expect(result).toEqual(mockTasks);
    });

    it("throws error when database is not configured", async () => {
      mockConfigStore.selectedDatabaseId = null as unknown as string;

      const config = getQueryConfig("test", "online");

      await expect(config.queryFn()).rejects.toThrow("Database not configured");
    });

    it("throws error when field mapping is not configured", async () => {
      mockConfigStore.fieldMapping = null;

      const config = getQueryConfig("test", "online");

      await expect(config.queryFn()).rejects.toThrow("Database not configured");
    });

    it("propagates errors from searchTasksOnline", async () => {
      mockSearchTasksOnline.mockRejectedValue(new Error("API Error"));

      const config = getQueryConfig("test", "online");

      await expect(config.queryFn()).rejects.toThrow("API Error");
    });

    it("uses correct database when database changes", async () => {
      mockSearchTasksOnline.mockResolvedValue([]);
      mockConfigStore.selectedDatabaseId = "new-db-789";

      const config = getQueryConfig("test", "online");
      await config.queryFn();

      expect(mockSearchTasksOnline).toHaveBeenCalledWith(
        "test",
        "new-db-789",
        expect.any(Object)
      );
    });
  });

  describe("cache configuration", () => {
    it("sets staleTime to 1 minute", () => {
      const config = getQueryConfig("test", "online");

      expect(config.staleTime).toBe(1000 * 60);
    });

    it("sets gcTime (cache time) to 5 minutes", () => {
      const config = getQueryConfig("test", "online");

      expect(config.gcTime).toBe(1000 * 60 * 5);
    });
  });

  describe("hook return value", () => {
    it("returns object with expected query result shape", () => {
      const result = useSearchTasks("test", "online");

      expect(result).toHaveProperty("data");
      expect(result).toHaveProperty("isLoading");
      expect(result).toHaveProperty("isError");
      expect(result).toHaveProperty("error");
    });
  });
});

describe("edge cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedQueryConfig = null;

    mockAuthStore.isAuthenticated = true;
    mockConfigStore.selectedDatabaseId = "db-123";
    mockConfigStore.fieldMapping = {
      taskName: "title-prop-id",
      status: "status-prop-id",
    } as FieldMapping;
    mockNetworkState.isOffline = false;
  });

  it("handles query with special characters", () => {
    const config = getQueryConfig("test @#$%", "online");

    expect(config.queryKey).toContain("test @#$%");
    expect(config.enabled).toBe(true);
  });

  it("handles query with unicode characters", () => {
    const config = getQueryConfig("тест", "online");

    expect(config.queryKey).toContain("тест");
    expect(config.enabled).toBe(true);
  });

  it("handles very long query strings", () => {
    const longQuery = "a".repeat(500);
    const config = getQueryConfig(longQuery, "online");

    expect(config.queryKey).toContain(longQuery);
    expect(config.enabled).toBe(true);
  });

  it("handles query with leading/trailing whitespace", () => {
    const config = getQueryConfig("  test  ", "online");

    // Query is passed as-is, trimming happens in searchTasksLocal
    expect(config.queryKey).toContain("  test  ");
  });

  it("handles exactly 2 character query", () => {
    const config = getQueryConfig("ab", "online");

    expect(config.enabled).toBe(true);
  });

  it("handles whitespace-only query (length check)", () => {
    // "   " has length 3, so passes the >= 2 check
    const config = getQueryConfig("   ", "online");

    expect(config.enabled).toBe(true); // Length check passes
  });
});
