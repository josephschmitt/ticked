import { create } from "zustand";
import type { FieldMapping } from "@/types/fieldMapping";

interface ConfigState {
  selectedDatabaseId: string | null;
  selectedDatabaseName: string | null;
  fieldMapping: FieldMapping | null;
  isConfigured: boolean;
  isLoading: boolean;
  setDatabase: (id: string, name: string) => void;
  setFieldMapping: (mapping: FieldMapping) => void;
  clearConfig: () => void;
  setLoading: (loading: boolean) => void;
  hydrate: () => Promise<void>;
}

export const useConfigStore = create<ConfigState>((set) => ({
  selectedDatabaseId: null,
  selectedDatabaseName: null,
  fieldMapping: null,
  isConfigured: false,
  isLoading: true,

  setDatabase: (id, name) =>
    set({
      selectedDatabaseId: id,
      selectedDatabaseName: name,
    }),

  setFieldMapping: (mapping) =>
    set({
      fieldMapping: mapping,
      isConfigured: true,
    }),

  clearConfig: () =>
    set({
      selectedDatabaseId: null,
      selectedDatabaseName: null,
      fieldMapping: null,
      isConfigured: false,
    }),

  setLoading: (loading) => set({ isLoading: loading }),

  // Will be implemented in Milestone 4
  hydrate: async () => {
    set({ isLoading: false });
  },
}));
