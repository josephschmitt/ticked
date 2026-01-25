import * as SecureStore from "expo-secure-store";
import { SECURE_STORAGE_KEYS, type SecureStorageKey } from "@/constants/storage";

/**
 * Secure storage wrapper for sensitive data like tokens.
 * Uses expo-secure-store which encrypts data on device.
 */

export async function setSecureItem(
  key: SecureStorageKey,
  value: string
): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    console.error(`Failed to store secure item ${key}:`, error);
    throw new Error(`Failed to store secure item: ${key}`);
  }
}

export async function getSecureItem(
  key: SecureStorageKey
): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.error(`Failed to retrieve secure item ${key}:`, error);
    return null;
  }
}

export async function deleteSecureItem(key: SecureStorageKey): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    console.error(`Failed to delete secure item ${key}:`, error);
  }
}

/**
 * Store all auth tokens securely.
 */
export async function storeAuthTokens(params: {
  accessToken: string;
  workspaceId: string;
  workspaceName: string;
  botId: string;
}): Promise<void> {
  await Promise.all([
    setSecureItem(SECURE_STORAGE_KEYS.ACCESS_TOKEN, params.accessToken),
    setSecureItem(SECURE_STORAGE_KEYS.WORKSPACE_ID, params.workspaceId),
    setSecureItem(SECURE_STORAGE_KEYS.WORKSPACE_NAME, params.workspaceName),
    setSecureItem(SECURE_STORAGE_KEYS.BOT_ID, params.botId),
  ]);
}

/**
 * Retrieve all auth tokens from secure storage.
 */
export async function getAuthTokens(): Promise<{
  accessToken: string | null;
  workspaceId: string | null;
  workspaceName: string | null;
  botId: string | null;
}> {
  const [accessToken, workspaceId, workspaceName, botId] = await Promise.all([
    getSecureItem(SECURE_STORAGE_KEYS.ACCESS_TOKEN),
    getSecureItem(SECURE_STORAGE_KEYS.WORKSPACE_ID),
    getSecureItem(SECURE_STORAGE_KEYS.WORKSPACE_NAME),
    getSecureItem(SECURE_STORAGE_KEYS.BOT_ID),
  ]);

  return { accessToken, workspaceId, workspaceName, botId };
}

/**
 * Clear all auth tokens from secure storage.
 */
export async function clearAuthTokens(): Promise<void> {
  await Promise.all([
    deleteSecureItem(SECURE_STORAGE_KEYS.ACCESS_TOKEN),
    deleteSecureItem(SECURE_STORAGE_KEYS.WORKSPACE_ID),
    deleteSecureItem(SECURE_STORAGE_KEYS.WORKSPACE_NAME),
    deleteSecureItem(SECURE_STORAGE_KEYS.BOT_ID),
  ]);
}
