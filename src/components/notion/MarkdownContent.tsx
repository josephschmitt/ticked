import { useCallback } from "react";
import type { NotionBlock } from "@/services/notion/operations/getPageContent";
import { getBlockChildren } from "@/services/notion/operations/getPageContent";
import { BlockListRenderer } from "./blocks";

interface MarkdownContentProps {
  blocks: NotionBlock[];
}

/**
 * Renders Notion blocks as native React Native components.
 * Uses the block registry for consistent, extensible rendering with
 * support for toggle blocks, images, bookmarks, and more.
 */
export function MarkdownContent({ blocks }: MarkdownContentProps) {
  // Callback for fetching children of blocks (used by toggle blocks)
  const handleFetchChildren = useCallback(async (blockId: string): Promise<NotionBlock[]> => {
    return getBlockChildren(blockId);
  }, []);

  return (
    <BlockListRenderer
      blocks={blocks}
      onFetchChildren={handleFetchChildren}
    />
  );
}
