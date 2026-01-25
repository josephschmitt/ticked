import type { NotionBlock } from "../operations/getPageContent";

/**
 * Convert a markdown string back to Notion blocks.
 *
 * This is a placeholder for future editing support.
 * When implemented, this will parse markdown and create
 * NotionBlock objects that can be sent to the Notion API.
 */
export function markdownToBlocks(_markdown: string): NotionBlock[] {
  // TODO: Implement markdown parsing
  // This will be needed when we add editing support
  throw new Error("markdownToBlocks is not yet implemented");
}
