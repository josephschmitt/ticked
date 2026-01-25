import { useQuery } from "@tanstack/react-query";
import { getDatabases } from "@/services/notion/operations/getDatabases";
import { useAuthStore } from "@/stores/authStore";

export const DATABASES_QUERY_KEY = ["databases"] as const;

export function useDatabases() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: DATABASES_QUERY_KEY,
    queryFn: getDatabases,
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
