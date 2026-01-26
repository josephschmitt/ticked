import { create } from "zustand";

export type SearchMode = "online" | "local";

interface SearchState {
  /** Current search query */
  query: string;
  /** Search mode: online (Notion API) or local (cached tasks) */
  mode: SearchMode;

  /** Update the search query */
  setQuery: (query: string) => void;
  /** Update the search mode */
  setMode: (mode: SearchMode) => void;
  /** Reset search state */
  reset: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  query: "",
  mode: "local",

  setQuery: (query) => set({ query }),
  setMode: (mode) => set({ mode }),
  reset: () => set({ query: "", mode: "local" }),
}));
