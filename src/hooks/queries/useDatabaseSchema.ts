import { useQuery } from "@tanstack/react-query";
import { getDatabaseSchema } from "@/services/notion/operations/getDatabaseSchema";
import { useAuthStore } from "@/stores/authStore";

export const DATABASE_SCHEMA_QUERY_KEY = ["databaseSchema"] as const;

export function useDatabaseSchema(databaseId: string | null) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: [...DATABASE_SCHEMA_QUERY_KEY, databaseId],
    queryFn: () => {
      if (!databaseId) {
        throw new Error("Database ID is required");
      }
      return getDatabaseSchema(databaseId);
    },
    enabled: isAuthenticated && !!databaseId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
