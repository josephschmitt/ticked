import { describe, it, expect, beforeEach } from "vitest";
import { useSearchStore } from "./searchStore";

describe("searchStore", () => {
  beforeEach(() => {
    // Reset store state before each test
    useSearchStore.setState({
      query: "",
      mode: "local",
    });
  });

  describe("initial state", () => {
    it("has empty query by default", () => {
      expect(useSearchStore.getState().query).toBe("");
    });

    it("has local mode by default", () => {
      expect(useSearchStore.getState().mode).toBe("local");
    });
  });

  describe("setQuery", () => {
    it("updates the query", () => {
      useSearchStore.getState().setQuery("test query");

      expect(useSearchStore.getState().query).toBe("test query");
    });

    it("can set empty query", () => {
      useSearchStore.getState().setQuery("something");
      useSearchStore.getState().setQuery("");

      expect(useSearchStore.getState().query).toBe("");
    });

    it("preserves special characters", () => {
      useSearchStore.getState().setQuery("test @#$%^&*()");

      expect(useSearchStore.getState().query).toBe("test @#$%^&*()");
    });

    it("does not affect mode", () => {
      useSearchStore.getState().setMode("online");
      useSearchStore.getState().setQuery("test");

      expect(useSearchStore.getState().mode).toBe("online");
    });
  });

  describe("setMode", () => {
    it("updates mode to online", () => {
      useSearchStore.getState().setMode("online");

      expect(useSearchStore.getState().mode).toBe("online");
    });

    it("updates mode to local", () => {
      useSearchStore.getState().setMode("online");
      useSearchStore.getState().setMode("local");

      expect(useSearchStore.getState().mode).toBe("local");
    });

    it("does not affect query", () => {
      useSearchStore.getState().setQuery("my search");
      useSearchStore.getState().setMode("online");

      expect(useSearchStore.getState().query).toBe("my search");
    });
  });

  describe("reset", () => {
    it("resets query to empty string", () => {
      useSearchStore.getState().setQuery("test query");
      useSearchStore.getState().reset();

      expect(useSearchStore.getState().query).toBe("");
    });

    it("resets mode to local", () => {
      useSearchStore.getState().setMode("online");
      useSearchStore.getState().reset();

      expect(useSearchStore.getState().mode).toBe("local");
    });

    it("resets both query and mode", () => {
      useSearchStore.getState().setQuery("search term");
      useSearchStore.getState().setMode("online");
      useSearchStore.getState().reset();

      const state = useSearchStore.getState();
      expect(state.query).toBe("");
      expect(state.mode).toBe("local");
    });

    it("is idempotent when already at defaults", () => {
      useSearchStore.getState().reset();
      useSearchStore.getState().reset();

      const state = useSearchStore.getState();
      expect(state.query).toBe("");
      expect(state.mode).toBe("local");
    });
  });

  describe("state transitions", () => {
    it("handles typical search workflow", () => {
      // User starts typing
      useSearchStore.getState().setQuery("t");
      expect(useSearchStore.getState().query).toBe("t");

      // User continues typing
      useSearchStore.getState().setQuery("te");
      useSearchStore.getState().setQuery("tes");
      useSearchStore.getState().setQuery("test");
      expect(useSearchStore.getState().query).toBe("test");

      // User switches to online mode
      useSearchStore.getState().setMode("online");
      expect(useSearchStore.getState().mode).toBe("online");
      expect(useSearchStore.getState().query).toBe("test"); // Query preserved

      // User cancels search
      useSearchStore.getState().reset();
      expect(useSearchStore.getState().query).toBe("");
      expect(useSearchStore.getState().mode).toBe("local");
    });

    it("handles rapid mode toggling", () => {
      const modes: Array<"online" | "local"> = [
        "online", "local", "online", "local", "online"
      ];

      modes.forEach((mode) => {
        useSearchStore.getState().setMode(mode);
      });

      // Final state should be the last mode
      expect(useSearchStore.getState().mode).toBe("online");
    });

    it("handles clearing and re-entering query", () => {
      useSearchStore.getState().setQuery("first search");
      useSearchStore.getState().setQuery("");
      useSearchStore.getState().setQuery("second search");

      expect(useSearchStore.getState().query).toBe("second search");
    });
  });

  describe("edge cases", () => {
    it("handles very long query strings", () => {
      const longQuery = "a".repeat(1000);
      useSearchStore.getState().setQuery(longQuery);

      expect(useSearchStore.getState().query).toBe(longQuery);
      expect(useSearchStore.getState().query.length).toBe(1000);
    });

    it("handles unicode characters", () => {
      useSearchStore.getState().setQuery("测试 тест テスト 🔍");

      expect(useSearchStore.getState().query).toBe("测试 тест テスト 🔍");
    });

    it("handles whitespace-only queries", () => {
      useSearchStore.getState().setQuery("   ");

      expect(useSearchStore.getState().query).toBe("   ");
    });

    it("handles newlines in query", () => {
      useSearchStore.getState().setQuery("line1\nline2");

      expect(useSearchStore.getState().query).toBe("line1\nline2");
    });
  });
});
