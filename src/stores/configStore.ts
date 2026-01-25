import { create } from "zustand";
import {
  storeDatabaseConfig,
  getDatabaseConfig,
  storeFieldMapping,
  getFieldMapping,
  storeCustomListName,
  getCustomListName,
  storeShowTaskTypeInline,
  getShowTaskTypeInline,
  storeApproachingDaysThreshold,
  getApproachingDaysThreshold,
  clearAllConfig,
} from "@/services/storage/asyncStorage";
import type { FieldMapping } from "@/types/fieldMapping";

interface ConfigState {
  selectedDatabaseId: string | null;
  selectedDatabaseName: string | null;
  customListName: string | null;
  fieldMapping: FieldMapping | null;
  showTaskTypeInline: boolean;
  approachingDaysThreshold: number;
  isConfigured: boolean;
  isLoading: boolean;
  setDatabase: (id: string, name: string) => Promise<void>;
  setCustomListName: (name: string | null) => Promise<void>;
  setFieldMapping: (mapping: FieldMapping) => Promise<void>;
  setShowTaskTypeInline: (show: boolean) => Promise<void>;
  setApproachingDaysThreshold: (days: number) => Promise<void>;
  clearConfig: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  hydrate: () => Promise<void>;
}

export const useConfigStore = create<ConfigState>((set, get) => ({
  selectedDatabaseId: null,
  selectedDatabaseName: null,
  customListName: null,
  fieldMapping: null,
  showTaskTypeInline: true,
  approachingDaysThreshold: 2,
  isConfigured: false,
  isLoading: true,

  setDatabase: async (id, name) => {
    // Store in async storage
    await storeDatabaseConfig({ databaseId: id, databaseName: name });

    // Update state
    set({
      selectedDatabaseId: id,
      selectedDatabaseName: name,
    });
  },

  setCustomListName: async (name) => {
    // Store in async storage
    await storeCustomListName(name);

    // Update state
    set({ customListName: name });
  },

  setFieldMapping: async (mapping) => {
    // Store in async storage
    await storeFieldMapping(mapping);

    // Update state
    set({
      fieldMapping: mapping,
      isConfigured: true,
    });
  },

  setShowTaskTypeInline: async (show) => {
    // Store in async storage
    await storeShowTaskTypeInline(show);

    // Update state
    set({ showTaskTypeInline: show });
  },

  setApproachingDaysThreshold: async (days) => {
    // Store in async storage
    await storeApproachingDaysThreshold(days);

    // Update state
    set({ approachingDaysThreshold: days });
  },

  clearConfig: async () => {
    // Clear from async storage
    await clearAllConfig();

    // Update state
    set({
      selectedDatabaseId: null,
      selectedDatabaseName: null,
      customListName: null,
      fieldMapping: null,
      isConfigured: false,
    });
  },

  setLoading: (loading) => set({ isLoading: loading }),

  hydrate: async () => {
    try {
      const [dbConfig, customListName, fieldMapping, showTaskTypeInline, approachingDaysThreshold] = await Promise.all([
        getDatabaseConfig(),
        getCustomListName(),
        getFieldMapping(),
        getShowTaskTypeInline(),
        getApproachingDaysThreshold(),
      ]);

      const isConfigured = !!(
        dbConfig.databaseId &&
        fieldMapping?.taskName &&
        fieldMapping?.status
      );

      set({
        selectedDatabaseId: dbConfig.databaseId,
        selectedDatabaseName: dbConfig.databaseName,
        customListName,
        fieldMapping,
        showTaskTypeInline,
        approachingDaysThreshold,
        isConfigured,
        isLoading: false,
      });
    } catch (error) {
      console.error("Failed to hydrate config store:", error);
      set({ isLoading: false });
    }
  },
}));
