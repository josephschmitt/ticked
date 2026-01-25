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
  | "callout";

export interface RichTextItem {
  type: "text";
  text: {
    content: string;
    link: { url: string } | null;
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
}

interface BlocksResponse {
  results: NotionBlock[];
  has_more: boolean;
  next_cursor: string | null;
}

/**
 * Fetch all blocks (content) from a Notion page.
 * Returns an array of block objects.
 */
export async function getPageContent(pageId: string): Promise<NotionBlock[]> {
  const client = getNotionClient();
  const blocks: NotionBlock[] = [];
  let cursor: string | undefined;

  do {
    const response = await client.blocks.children.list({
      block_id: pageId,
      start_cursor: cursor,
      page_size: 100,
    }) as unknown as BlocksResponse;

    blocks.push(...response.results);
    cursor = response.next_cursor ?? undefined;
  } while (cursor);

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
