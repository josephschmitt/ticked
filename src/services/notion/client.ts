import { Client } from "@notionhq/client";
import { useAuthStore } from "@/stores/authStore";

/**
 * Create an authenticated Notion client.
 * Uses the access token from the auth store.
 */
export function createNotionClient(): Client {
  const accessToken = useAuthStore.getState().accessToken;

  if (!accessToken) {
    throw new Error("Not authenticated - no access token available");
  }

  return new Client({
    auth: accessToken,
  });
}

/**
 * Get the Notion client singleton.
 * Creates a new client if the token changes.
 */
let cachedClient: Client | null = null;
let cachedToken: string | null = null;

export function getNotionClient(): Client {
  const accessToken = useAuthStore.getState().accessToken;

  if (!accessToken) {
    throw new Error("Not authenticated - no access token available");
  }

  // Return cached client if token hasn't changed
  if (cachedClient && cachedToken === accessToken) {
    return cachedClient;
  }

  // Create new client
  cachedClient = new Client({ auth: accessToken });
  cachedToken = accessToken;

  return cachedClient;
}

/**
 * Clear the cached client (call on logout).
 */
export function clearNotionClient(): void {
  cachedClient = null;
  cachedToken = null;
}
