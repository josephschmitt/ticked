import { getNotionClient } from "../client";

/**
 * Notion block types we support rendering.
 */
export type SupportedBlockType =
  | "paragraph"
  | "heading_1"
  | "heading_2"
  | "heading_3"
  | "bulleted_list_item"
  | "numbered_list_item"
  | "to_do"
  | "divider"
  | "quote"
  | "code"
  | "callout"
  | "toggle"
  | "image"
  | "bookmark";

export interface RichTextItem {
  type: "text" | "mention" | "equation";
  text?: {
    content: string;
    link: { url: string } | null;
  };
  mention?: {
    type: "link_preview" | "page" | "database" | "date" | "user";
    link_preview?: { url: string };
    page?: { id: string };
    database?: { id: string };
    date?: { start: string; end: string | null };
    user?: { id: string };
  };
  annotations: {
    bold: boolean;
    italic: boolean;
    strikethrough: boolean;
    underline: boolean;
    code: boolean;
    color: string;
  };
  plain_text: string;
  href?: string | null;
}

export interface NotionBlock {
  id: string;
  type: string;
  has_children: boolean;
  paragraph?: {
    rich_text: RichTextItem[];
    color: string;
  };
  heading_1?: {
    rich_text: RichTextItem[];
    color: string;
  };
  heading_2?: {
    rich_text: RichTextItem[];
    color: string;
  };
  heading_3?: {
    rich_text: RichTextItem[];
    color: string;
  };
  bulleted_list_item?: {
    rich_text: RichTextItem[];
    color: string;
  };
  numbered_list_item?: {
    rich_text: RichTextItem[];
    color: string;
  };
  to_do?: {
    rich_text: RichTextItem[];
    checked: boolean;
    color: string;
  };
  divider?: object;
  quote?: {
    rich_text: RichTextItem[];
    color: string;
  };
  code?: {
    rich_text: RichTextItem[];
    caption: RichTextItem[];
    language: string;
  };
  callout?: {
    rich_text: RichTextItem[];
    icon: { type: string; emoji?: string } | null;
    color: string;
  };
  toggle?: {
    rich_text: RichTextItem[];
    color: string;
  };
  image?: {
    type: "file" | "external";
    file?: {
      url: string;
      expiry_time: string;
    };
    external?: {
      url: string;
    };
    caption: RichTextItem[];
  };
  bookmark?: {
    url: string;
    caption: RichTextItem[];
  };
  /** Pre-fetched children for nested blocks (lists, etc.) */
  children?: NotionBlock[];
}

interface BlocksResponse {
  results: NotionBlock[];
  has_more: boolean;
  next_cursor: string | null;
}

/**
 * Fetch all blocks (content) from a Notion page or block.
 * Returns an array of block objects.
 */
export async function getPageContent(blockId: string): Promise<NotionBlock[]> {
  const client = getNotionClient();
  const blocks: NotionBlock[] = [];
  let cursor: string | undefined;

  do {
    const response = await client.blocks.children.list({
      block_id: blockId,
      start_cursor: cursor,
      page_size: 100,
    }) as unknown as BlocksResponse;

    blocks.push(...response.results);
    cursor = response.next_cursor ?? undefined;
  } while (cursor);

  return blocks;
}

/**
 * Fetch children of a specific block (used for toggle blocks, etc.).
 * This is an alias for getPageContent as Notion uses the same API.
 */
export async function getBlockChildren(blockId: string): Promise<NotionBlock[]> {
  return getPageContent(blockId);
}

/** Block types that can have nested children we want to pre-fetch */
const NESTABLE_BLOCK_TYPES = [
  "bulleted_list_item",
  "numbered_list_item",
  "to_do",
] as const;

/**
 * Check if a block type supports nested children that should be pre-fetched.
 * Note: Toggle blocks are excluded as they use lazy loading.
 */
function isNestableBlockType(type: string): boolean {
  return NESTABLE_BLOCK_TYPES.includes(type as typeof NESTABLE_BLOCK_TYPES[number]);
}

/**
 * Fetch page content with nested children pre-fetched up to a specified depth.
 * This recursively fetches children for list items (bulleted, numbered, to-do)
 * to support indented lists without additional API calls during rendering.
 *
 * @param blockId - The page or block ID to fetch content from
 * @param maxDepth - Maximum depth to fetch children (default: 3)
 * @returns Array of blocks with children attached
 */
export async function getPageContentWithChildren(
  blockId: string,
  maxDepth: number = 3
): Promise<NotionBlock[]> {
  const blocks = await getPageContent(blockId);

  if (maxDepth <= 0) {
    return blocks;
  }

  // Find blocks that need children fetched (list items with has_children)
  const blocksNeedingChildren = blocks.filter(
    (block) => isNestableBlockType(block.type) && block.has_children
  );

  if (blocksNeedingChildren.length === 0) {
    return blocks;
  }

  // Fetch all children in parallel for performance
  const childrenResults = await Promise.all(
    blocksNeedingChildren.map((block) =>
      getPageContentWithChildren(block.id, maxDepth - 1)
    )
  );

  // Attach children to their parent blocks
  blocksNeedingChildren.forEach((block, index) => {
    block.children = childrenResults[index];
  });

  return blocks;
}

/**
 * Extract plain text from rich text array.
 */
export function richTextToPlainText(richText: RichTextItem[]): string {
  return richText.map((item) => item.plain_text).join("");
}

/**
 * Get a preview of the page content (first paragraph or text block).
 */
export function getContentPreview(blocks: NotionBlock[], maxLength: number = 100): string {
  for (const block of blocks) {
    let richText: RichTextItem[] | undefined;

    switch (block.type) {
      case "paragraph":
        richText = block.paragraph?.rich_text;
        break;
      case "heading_1":
        richText = block.heading_1?.rich_text;
        break;
      case "heading_2":
        richText = block.heading_2?.rich_text;
        break;
      case "heading_3":
        richText = block.heading_3?.rich_text;
        break;
      case "bulleted_list_item":
        richText = block.bulleted_list_item?.rich_text;
        break;
      case "numbered_list_item":
        richText = block.numbered_list_item?.rich_text;
        break;
      case "to_do":
        richText = block.to_do?.rich_text;
        break;
      case "quote":
        richText = block.quote?.rich_text;
        break;
      case "toggle":
        richText = block.toggle?.rich_text;
        break;
      case "callout":
        richText = block.callout?.rich_text;
        break;
    }

    if (richText && richText.length > 0) {
      const text = richTextToPlainText(richText);
      if (text.trim()) {
        return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
      }
    }
  }

  return "";
}
