import { useQuery } from "@tanstack/react-query";
import { getPageContent, NotionBlock } from "@/services/notion/operations/getPageContent";
import { useAuthStore } from "@/stores/authStore";

export const PAGE_CONTENT_QUERY_KEY = ["pageContent"] as const;

/**
 * Hook to fetch page content (blocks) from Notion.
 * Content is fetched when the task detail sheet is opened.
 */
export function usePageContent(pageId: string | undefined) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery<NotionBlock[]>({
    queryKey: [...PAGE_CONTENT_QUERY_KEY, pageId],
    queryFn: () => {
      if (!pageId) {
        throw new Error("Page ID is required");
      }
      return getPageContent(pageId);
    },
    enabled: isAuthenticated && !!pageId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
