import AsyncStorage from "@react-native-async-storage/async-storage";
import { ASYNC_STORAGE_KEYS, type AsyncStorageKey } from "@/constants/storage";
import type { FieldMapping } from "@/types/fieldMapping";

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
 * Clear all configuration (used when signing out or reconfiguring).
 */
export async function clearAllConfig(): Promise<void> {
  await Promise.all([
    deleteAsyncItem(ASYNC_STORAGE_KEYS.SELECTED_DATABASE_ID),
    deleteAsyncItem(ASYNC_STORAGE_KEYS.SELECTED_DATABASE_NAME),
    deleteAsyncItem(ASYNC_STORAGE_KEYS.FIELD_MAPPING),
  ]);
}
