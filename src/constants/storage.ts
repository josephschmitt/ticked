// Secure storage keys (using expo-secure-store)
export const SECURE_STORAGE_KEYS = {
  ACCESS_TOKEN: "notion_access_token",
  WORKSPACE_ID: "notion_workspace_id",
  WORKSPACE_NAME: "notion_workspace_name",
  BOT_ID: "notion_bot_id",
} as const;

// Async storage keys (using @react-native-async-storage)
export const ASYNC_STORAGE_KEYS = {
  SELECTED_DATABASE_ID: "selected_database_id",
  SELECTED_DATABASE_NAME: "selected_database_name",
  CUSTOM_LIST_NAME: "custom_list_name",
  FIELD_MAPPING: "field_mapping",
  THEME_PREFERENCE: "theme_preference",
  ONBOARDING_COMPLETE: "onboarding_complete",
  SHOW_TASK_TYPE_INLINE: "show_task_type_inline",
  APPROACHING_DAYS_THRESHOLD: "approaching_days_threshold",
  DEFAULT_STATUS_ID: "default_status_id",
  // Offline cache keys
  CACHED_TASKS: "cached_tasks",
  CACHED_STATUSES: "cached_statuses",
  LAST_SYNCED_AT: "last_synced_at",
  MUTATION_QUEUE: "mutation_queue",
  SYNC_CONFLICTS: "sync_conflicts",
} as const;

export type SecureStorageKey =
  (typeof SECURE_STORAGE_KEYS)[keyof typeof SECURE_STORAGE_KEYS];

export type AsyncStorageKey =
  (typeof ASYNC_STORAGE_KEYS)[keyof typeof ASYNC_STORAGE_KEYS];
