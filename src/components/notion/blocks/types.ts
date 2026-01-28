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
  /** Callback to fetch children for blocks with has_children */
  onFetchChildren?: (blockId: string) => Promise<NotionBlock[]>;
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
