import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { searchTasksOnline } from "@/services/search/searchService";
import { useAuthStore } from "@/stores/authStore";
import { useConfigStore } from "@/stores/configStore";
import { useNetworkState } from "@/hooks/useNetworkState";
import type { SearchMode } from "@/stores/searchStore";

export const SEARCH_QUERY_KEY = ["search"] as const;

/**
 * Custom hook that debounces a value.
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook to search tasks using Notion API.
 * Includes debouncing and proper query key management.
 */
export function useSearchTasks(query: string, mode: SearchMode) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const databaseId = useConfigStore((state) => state.selectedDatabaseId);
  const fieldMapping = useConfigStore((state) => state.fieldMapping);
  const { isOffline } = useNetworkState();

  // Debounce the search query (300ms)
  const debouncedQuery = useDebounce(query, 300);

  // Only enable online search when:
  // - Mode is "online"
  // - Query has at least 2 characters
  // - User is authenticated
  // - Database is configured
  // - Network is available
  const shouldSearch =
    mode === "online" &&
    debouncedQuery.length >= 2 &&
    isAuthenticated &&
    !!databaseId &&
    !!fieldMapping &&
    !isOffline;

  return useQuery({
    queryKey: [...SEARCH_QUERY_KEY, databaseId, debouncedQuery, mode],
    queryFn: async () => {
      if (!databaseId || !fieldMapping) {
        throw new Error("Database not configured");
      }
      return searchTasksOnline(debouncedQuery, databaseId, fieldMapping);
    },
    enabled: shouldSearch,
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes (formerly cacheTime)
  });
}
