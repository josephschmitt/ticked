import { useQuery } from "@tanstack/react-query";
import { getRelationOptions } from "@/services/notion/operations/getRelationOptions";
import { useAuthStore } from "@/stores/authStore";

export const RELATION_OPTIONS_QUERY_KEY = ["relationOptions"] as const;

export function useRelationOptions(targetDatabaseId: string | null | undefined) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: [...RELATION_OPTIONS_QUERY_KEY, targetDatabaseId],
    queryFn: () => {
      if (!targetDatabaseId) {
        throw new Error("Target database ID is required");
      }
      return getRelationOptions(targetDatabaseId);
    },
    enabled: isAuthenticated && !!targetDatabaseId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
