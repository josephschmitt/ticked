import React from "react";
import { useColorScheme } from "react-native";
import type { NotionBlock } from "@/services/notion/operations/getPageContent";
import type { BlockProps, BlockContext, BlockComponent } from "./types";

// Import all block components
import { ParagraphBlock } from "./ParagraphBlock";
import { HeadingBlock } from "./HeadingBlock";
import { BulletedListItemBlock, NumberedListItemBlock } from "./ListItemBlock";
import { ToDoBlock } from "./ToDoBlock";
import { DividerBlock } from "./DividerBlock";
import { QuoteBlock } from "./QuoteBlock";
import { CodeBlock } from "./CodeBlock";
import { CalloutBlock } from "./CalloutBlock";
import { ToggleBlock } from "./ToggleBlock";
import { ImageBlock } from "./ImageBlock";
import { BookmarkBlock } from "./BookmarkBlock";
import { UnsupportedBlock } from "./UnsupportedBlock";

// Re-export types
export type { BlockProps, BlockContext, BlockComponent } from "./types";
export { RichText } from "./RichText";

/**
 * Registry mapping block types to their renderer components.
 * Add new block types here to extend rendering support.
 */
const blockRegistry: Record<string, BlockComponent> = {
  paragraph: ParagraphBlock,
  heading_1: HeadingBlock,
  heading_2: HeadingBlock,
  heading_3: HeadingBlock,
  bulleted_list_item: BulletedListItemBlock,
  numbered_list_item: NumberedListItemBlock,
  to_do: ToDoBlock,
  divider: DividerBlock,
  quote: QuoteBlock,
  code: CodeBlock,
  callout: CalloutBlock,
  // New block types
  toggle: ToggleBlock as unknown as BlockComponent, // Cast needed due to extra renderBlocks prop
  image: ImageBlock,
  bookmark: BookmarkBlock,
};

/**
 * Get the component for a block type, or UnsupportedBlock as fallback.
 */
export function getBlockComponent(type: string): BlockComponent {
  return blockRegistry[type] ?? UnsupportedBlock;
}

/**
 * Check if a block type is supported.
 */
export function isBlockTypeSupported(type: string): boolean {
  return type in blockRegistry;
}

/**
 * Render a single block with the appropriate component.
 */
function renderBlock(
  block: NotionBlock,
  context: BlockContext,
  renderBlocks: (blocks: NotionBlock[], context: BlockContext) => React.ReactNode
): React.ReactNode {
  const Component = getBlockComponent(block.type);

  // Special handling for toggle blocks which need renderBlocks callback
  if (block.type === "toggle") {
    return (
      <ToggleBlock
        key={block.id}
        block={block}
        context={context}
        renderBlocks={renderBlocks}
      />
    );
  }

  return <Component key={block.id} block={block} context={context} />;
}

/**
 * Render a list of blocks with proper context tracking.
 */
function renderBlockList(
  blocks: NotionBlock[],
  context: BlockContext
): React.ReactNode {
  let numberedListIndex = 0;

  return blocks.map((block) => {
    // Track numbered list position
    if (block.type === "numbered_list_item") {
      numberedListIndex++;
    } else {
      numberedListIndex = 0;
    }

    const blockContext: BlockContext = {
      ...context,
      index: block.type === "numbered_list_item" ? numberedListIndex - 1 : 0,
    };

    return renderBlock(block, blockContext, renderBlockList);
  });
}

interface BlockListRendererProps {
  blocks: NotionBlock[];
  onFetchChildren?: (blockId: string) => Promise<NotionBlock[]>;
}

/**
 * Main component for rendering a list of Notion blocks.
 * Handles context setup and delegates to the block registry.
 */
export function BlockListRenderer({ blocks, onFetchChildren }: BlockListRendererProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const context: BlockContext = {
    depth: 0,
    index: 0,
    isDark,
    onFetchChildren,
  };

  return <>{renderBlockList(blocks, context)}</>;
}

/**
 * Single block renderer for individual block rendering.
 * @deprecated Use BlockListRenderer for proper context handling.
 */
export function BlockRenderer({ block, index = 0 }: { block: NotionBlock; index?: number }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const context: BlockContext = {
    depth: 0,
    index,
    isDark,
  };

  return <>{renderBlock(block, context, renderBlockList)}</>;
}
