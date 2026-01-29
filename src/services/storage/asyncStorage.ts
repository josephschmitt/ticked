import AsyncStorage from "@react-native-async-storage/async-storage";
import { ASYNC_STORAGE_KEYS, type AsyncStorageKey } from "@/constants/storage";
import type { FieldMapping } from "@/types/fieldMapping";
import type { Task, TaskStatus } from "@/types/task";
import type { PendingMutation, SyncConflict } from "@/types/mutation";

/**
 * Async storage wrapper for non-sensitive preferences and configuration.
 * Uses @react-native-async-storage/async-storage.
 */

export async function setAsyncItem(
  key: AsyncStorageKey,
  value: string
): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    console.error(`Failed to store async item ${key}:`, error);
    throw new Error(`Failed to store item: ${key}`);
  }
}

export async function getAsyncItem(
  key: AsyncStorageKey
): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch (error) {
    console.error(`Failed to retrieve async item ${key}:`, error);
    return null;
  }
}

export async function deleteAsyncItem(key: AsyncStorageKey): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error(`Failed to delete async item ${key}:`, error);
  }
}

/**
 * Store database configuration.
 */
export async function storeDatabaseConfig(params: {
  databaseId: string;
  databaseName: string;
}): Promise<void> {
  await Promise.all([
    setAsyncItem(ASYNC_STORAGE_KEYS.SELECTED_DATABASE_ID, params.databaseId),
    setAsyncItem(ASYNC_STORAGE_KEYS.SELECTED_DATABASE_NAME, params.databaseName),
  ]);
}

/**
 * Get database configuration.
 */
export async function getDatabaseConfig(): Promise<{
  databaseId: string | null;
  databaseName: string | null;
}> {
  const [databaseId, databaseName] = await Promise.all([
    getAsyncItem(ASYNC_STORAGE_KEYS.SELECTED_DATABASE_ID),
    getAsyncItem(ASYNC_STORAGE_KEYS.SELECTED_DATABASE_NAME),
  ]);

  return { databaseId, databaseName };
}

/**
 * Store field mapping configuration.
 */
export async function storeFieldMapping(mapping: FieldMapping): Promise<void> {
  await setAsyncItem(
    ASYNC_STORAGE_KEYS.FIELD_MAPPING,
    JSON.stringify(mapping)
  );
}

/**
 * Get field mapping configuration.
 */
export async function getFieldMapping(): Promise<FieldMapping | null> {
  const json = await getAsyncItem(ASYNC_STORAGE_KEYS.FIELD_MAPPING);
  if (!json) return null;

  try {
    return JSON.parse(json) as FieldMapping;
  } catch {
    console.error("Failed to parse field mapping JSON");
    return null;
  }
}

/**
 * Store custom list name.
 */
export async function storeCustomListName(name: string | null): Promise<void> {
  if (name) {
    await setAsyncItem(ASYNC_STORAGE_KEYS.CUSTOM_LIST_NAME, name);
  } else {
    await deleteAsyncItem(ASYNC_STORAGE_KEYS.CUSTOM_LIST_NAME);
  }
}

/**
 * Get custom list name.
 */
export async function getCustomListName(): Promise<string | null> {
  return getAsyncItem(ASYNC_STORAGE_KEYS.CUSTOM_LIST_NAME);
}

/**
 * Store show task type inline preference.
 */
export async function storeShowTaskTypeInline(show: boolean): Promise<void> {
  await setAsyncItem(ASYNC_STORAGE_KEYS.SHOW_TASK_TYPE_INLINE, JSON.stringify(show));
}

/**
 * Get show task type inline preference (defaults to true).
 */
export async function getShowTaskTypeInline(): Promise<boolean> {
  const value = await getAsyncItem(ASYNC_STORAGE_KEYS.SHOW_TASK_TYPE_INLINE);
  if (value === null) return true; // Default to true
  try {
    return JSON.parse(value) as boolean;
  } catch {
    return true;
  }
}

/**
 * Store approaching days threshold preference.
 */
export async function storeApproachingDaysThreshold(days: number): Promise<void> {
  await setAsyncItem(ASYNC_STORAGE_KEYS.APPROACHING_DAYS_THRESHOLD, JSON.stringify(days));
}

/**
 * Get approaching days threshold preference (defaults to 2).
 */
export async function getApproachingDaysThreshold(): Promise<number> {
  const value = await getAsyncItem(ASYNC_STORAGE_KEYS.APPROACHING_DAYS_THRESHOLD);
  if (value === null) return 2; // Default to 2 days
  try {
    return JSON.parse(value) as number;
  } catch {
    return 2;
  }
}

/**
 * Store default status ID (used when unchecking tasks).
 */
export async function storeDefaultStatusId(id: string | null): Promise<void> {
  if (id) {
    await setAsyncItem(ASYNC_STORAGE_KEYS.DEFAULT_STATUS_ID, id);
  } else {
    await deleteAsyncItem(ASYNC_STORAGE_KEYS.DEFAULT_STATUS_ID);
  }
}

/**
 * Get default status ID.
 */
export async function getDefaultStatusId(): Promise<string | null> {
  return getAsyncItem(ASYNC_STORAGE_KEYS.DEFAULT_STATUS_ID);
}

/**
 * Store hidden status IDs (statuses that won't be shown on the task list).
 */
export async function storeHiddenStatusIds(ids: string[]): Promise<void> {
  await setAsyncItem(ASYNC_STORAGE_KEYS.HIDDEN_STATUS_IDS, JSON.stringify(ids));
}

/**
 * Get hidden status IDs (defaults to empty array - all statuses visible).
 */
export async function getHiddenStatusIds(): Promise<string[]> {
  const value = await getAsyncItem(ASYNC_STORAGE_KEYS.HIDDEN_STATUS_IDS);
  if (value === null) return [];
  try {
    return JSON.parse(value) as string[];
  } catch {
    return [];
  }
}

/**
 * Clear all configuration (used when signing out or reconfiguring).
 */
export async function clearAllConfig(): Promise<void> {
  await Promise.all([
    deleteAsyncItem(ASYNC_STORAGE_KEYS.SELECTED_DATABASE_ID),
    deleteAsyncItem(ASYNC_STORAGE_KEYS.SELECTED_DATABASE_NAME),
    deleteAsyncItem(ASYNC_STORAGE_KEYS.CUSTOM_LIST_NAME),
    deleteAsyncItem(ASYNC_STORAGE_KEYS.FIELD_MAPPING),
    deleteAsyncItem(ASYNC_STORAGE_KEYS.DEFAULT_STATUS_ID),
  ]);
}

// ==========================================
// Task Cache Storage Functions
// ==========================================

/**
 * Store cached tasks.
 */
export async function storeCachedTasks(tasks: Task[]): Promise<void> {
  await setAsyncItem(ASYNC_STORAGE_KEYS.CACHED_TASKS, JSON.stringify(tasks));
}

/**
 * Get cached tasks.
 */
export async function getCachedTasks(): Promise<Task[]> {
  const json = await getAsyncItem(ASYNC_STORAGE_KEYS.CACHED_TASKS);
  if (!json) return [];

  try {
    return JSON.parse(json) as Task[];
  } catch {
    console.error("Failed to parse cached tasks JSON");
    return [];
  }
}

/**
 * Store cached statuses.
 */
export async function storeCachedStatuses(statuses: TaskStatus[]): Promise<void> {
  await setAsyncItem(ASYNC_STORAGE_KEYS.CACHED_STATUSES, JSON.stringify(statuses));
}

/**
 * Get cached statuses.
 */
export async function getCachedStatuses(): Promise<TaskStatus[]> {
  const json = await getAsyncItem(ASYNC_STORAGE_KEYS.CACHED_STATUSES);
  if (!json) return [];

  try {
    return JSON.parse(json) as TaskStatus[];
  } catch {
    console.error("Failed to parse cached statuses JSON");
    return [];
  }
}

/**
 * Store last synced timestamp.
 */
export async function storeLastSyncedAt(timestamp: string): Promise<void> {
  await setAsyncItem(ASYNC_STORAGE_KEYS.LAST_SYNCED_AT, timestamp);
}

/**
 * Get last synced timestamp.
 */
export async function getLastSyncedAt(): Promise<string | null> {
  return getAsyncItem(ASYNC_STORAGE_KEYS.LAST_SYNCED_AT);
}

/**
 * Clear task cache (used when switching databases or signing out).
 */
export async function clearTaskCache(): Promise<void> {
  await Promise.all([
    deleteAsyncItem(ASYNC_STORAGE_KEYS.CACHED_TASKS),
    deleteAsyncItem(ASYNC_STORAGE_KEYS.CACHED_STATUSES),
    deleteAsyncItem(ASYNC_STORAGE_KEYS.LAST_SYNCED_AT),
  ]);
}

// ==========================================
// Mutation Queue Storage Functions
// ==========================================

/**
 * Store mutation queue.
 */
export async function storeMutationQueue(queue: PendingMutation[]): Promise<void> {
  await setAsyncItem(ASYNC_STORAGE_KEYS.MUTATION_QUEUE, JSON.stringify(queue));
}

/**
 * Get mutation queue.
 */
export async function getMutationQueue(): Promise<PendingMutation[]> {
  const json = await getAsyncItem(ASYNC_STORAGE_KEYS.MUTATION_QUEUE);
  if (!json) return [];

  try {
    return JSON.parse(json) as PendingMutation[];
  } catch {
    console.error("Failed to parse mutation queue JSON");
    return [];
  }
}

/**
 * Store sync conflicts.
 */
export async function storeSyncConflicts(conflicts: SyncConflict[]): Promise<void> {
  await setAsyncItem(ASYNC_STORAGE_KEYS.SYNC_CONFLICTS, JSON.stringify(conflicts));
}

/**
 * Get sync conflicts.
 */
export async function getSyncConflicts(): Promise<SyncConflict[]> {
  const json = await getAsyncItem(ASYNC_STORAGE_KEYS.SYNC_CONFLICTS);
  if (!json) return [];

  try {
    return JSON.parse(json) as SyncConflict[];
  } catch {
    console.error("Failed to parse sync conflicts JSON");
    return [];
  }
}

/**
 * Clear mutation queue and conflicts.
 */
export async function clearMutationData(): Promise<void> {
  await Promise.all([
    deleteAsyncItem(ASYNC_STORAGE_KEYS.MUTATION_QUEUE),
    deleteAsyncItem(ASYNC_STORAGE_KEYS.SYNC_CONFLICTS),
  ]);
}
