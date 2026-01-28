import type React from "react";
import type { NotionBlock, RichTextItem } from "@/services/notion/operations/getPageContent";

/**
 * Context passed to all block components for rendering.
 */
export interface BlockContext {
  /** Current nesting depth for indentation */
  depth: number;
  /** Index within the current list (for numbered lists) */
  index: number;
  /** Whether dark mode is active */
  isDark: boolean;
  /** Callback to fetch children for blocks with has_children (lazy loading) */
  onFetchChildren?: (blockId: string) => Promise<NotionBlock[]>;
  /** Callback to render pre-fetched children blocks */
  renderChildren?: (children: NotionBlock[]) => React.ReactNode;
}

/**
 * Props passed to each block component.
 */
export interface BlockProps {
  block: NotionBlock;
  context: BlockContext;
}

/**
 * Props for the RichText component.
 */
export interface RichTextProps {
  richText: RichTextItem[];
  style?: object;
}

/**
 * Block component type for the registry.
 */
export type BlockComponent = React.ComponentType<BlockProps>;
