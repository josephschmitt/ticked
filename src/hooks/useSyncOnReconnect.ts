import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNetworkState } from "./useNetworkState";
import { useMutationQueueStore } from "@/stores/mutationQueueStore";
import { processQueue } from "@/services/sync/syncManager";
import { TASKS_QUERY_KEY, COMPLETED_TASKS_QUERY_KEY } from "@/hooks/queries/useTasks";
import { useConfigStore } from "@/stores/configStore";

/**
 * Hook that automatically processes the mutation queue when the device reconnects.
 * Should be called once at the app root level.
 */
export function useSyncOnReconnect() {
  const queryClient = useQueryClient();
  const { isOnline, isInitialized } = useNetworkState();
  const wasOffline = useRef(false);
  const isSyncing = useRef(false);

  const queueLength = useMutationQueueStore((state) => state.queue.length);
  const syncStatus = useMutationQueueStore((state) => state.syncStatus);
  const databaseId = useConfigStore((state) => state.selectedDatabaseId);

  useEffect(() => {
    if (!isInitialized) return;

    // Track when we go offline
    if (!isOnline) {
      wasOffline.current = true;
      return;
    }

    // Check if we just came back online and have pending mutations
    if (wasOffline.current && isOnline && queueLength > 0 && !isSyncing.current) {
      wasOffline.current = false;
      isSyncing.current = true;

      // Process the queue
      processQueue()
        .then(async (result) => {
          console.log("Sync completed:", result);

          // Refetch tasks to get latest server state
          if (databaseId) {
            await Promise.all([
              queryClient.invalidateQueries({ queryKey: [...TASKS_QUERY_KEY, databaseId] }),
              queryClient.invalidateQueries({ queryKey: [...COMPLETED_TASKS_QUERY_KEY, databaseId] }),
            ]);
          }
        })
        .catch((error) => {
          console.error("Sync failed:", error);
        })
        .finally(() => {
          isSyncing.current = false;
        });
    } else if (wasOffline.current && isOnline) {
      // We came back online but no pending mutations
      wasOffline.current = false;

      // Still refetch to get any server changes made while offline
      if (databaseId) {
        queryClient.invalidateQueries({ queryKey: [...TASKS_QUERY_KEY, databaseId] });
        queryClient.invalidateQueries({ queryKey: [...COMPLETED_TASKS_QUERY_KEY, databaseId] });
      }
    }
  }, [isOnline, isInitialized, queueLength, queryClient, databaseId]);

  return {
    syncStatus,
    pendingCount: queueLength,
    isSyncing: syncStatus === "syncing",
  };
}

/**
 * Hook to manually trigger a sync.
 */
export function useManualSync() {
  const queryClient = useQueryClient();
  const { isOnline } = useNetworkState();
  const databaseId = useConfigStore((state) => state.selectedDatabaseId);
  const queueLength = useMutationQueueStore((state) => state.queue.length);
  const setSyncStatus = useMutationQueueStore((state) => state.setSyncStatus);

  const sync = async () => {
    if (!isOnline) {
      console.warn("Cannot sync while offline");
      return { success: false, reason: "offline" };
    }

    if (queueLength === 0) {
      return { success: true, processed: 0 };
    }

    try {
      const result = await processQueue();

      // Refetch tasks after sync
      if (databaseId) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: [...TASKS_QUERY_KEY, databaseId] }),
          queryClient.invalidateQueries({ queryKey: [...COMPLETED_TASKS_QUERY_KEY, databaseId] }),
        ]);
      }

      return { success: true, ...result };
    } catch (error) {
      console.error("Manual sync failed:", error);
      setSyncStatus("error");
      return { success: false, reason: "error" };
    }
  };

  return {
    sync,
    canSync: isOnline && queueLength > 0,
    pendingCount: queueLength,
  };
}
