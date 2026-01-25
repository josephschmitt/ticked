import type { NotionBlock, RichTextItem } from "../operations/getPageContent";

/**
 * Convert rich text annotations to markdown syntax.
 */
function richTextToMarkdown(richText: RichTextItem[]): string {
  return richText.map((item) => {
    let text = item.plain_text;
    const { annotations, type } = item;

    // Apply annotations in order (innermost first)
    if (annotations.code) {
      text = `\`${text}\``;
    }
    if (annotations.strikethrough) {
      text = `~~${text}~~`;
    }
    if (annotations.bold) {
      text = `**${text}**`;
    }
    if (annotations.italic) {
      text = `*${text}*`;
    }
    if (annotations.underline) {
      text = `<u>${text}</u>`;
    }

    // Handle links based on item type
    if (type === "text" && item.text?.link?.url) {
      // Regular text with a link
      text = `[${text}](${item.text.link.url})`;
    } else if (type === "mention" && item.href) {
      // Mention with href (link_preview, page mention, etc.)
      // For link_preview, plain_text is the URL - make it a clickable link
      text = `[${text}](${item.href})`;
    }

    return text;
  }).join("");
}

/**
 * Convert an array of Notion blocks to a markdown string.
 */
export function blocksToMarkdown(blocks: NotionBlock[]): string {
  const lines: string[] = [];
  let numberedListIndex = 0;

  for (const block of blocks) {
    // Track numbered list position
    if (block.type === "numbered_list_item") {
      numberedListIndex++;
    } else {
      numberedListIndex = 0;
    }

    switch (block.type) {
      case "paragraph": {
        const text = richTextToMarkdown(block.paragraph?.rich_text || []);
        if (text) {
          lines.push(text + "\n");
        } else {
          // Empty paragraph - just add spacing
          lines.push("\n");
        }
        break;
      }

      case "heading_1": {
        const text = richTextToMarkdown(block.heading_1?.rich_text || []);
        lines.push(`# ${text}\n`);
        break;
      }

      case "heading_2": {
        const text = richTextToMarkdown(block.heading_2?.rich_text || []);
        lines.push(`## ${text}\n`);
        break;
      }

      case "heading_3": {
        const text = richTextToMarkdown(block.heading_3?.rich_text || []);
        lines.push(`### ${text}\n`);
        break;
      }

      case "bulleted_list_item": {
        const text = richTextToMarkdown(block.bulleted_list_item?.rich_text || []);
        lines.push(`- ${text}\n`);
        break;
      }

      case "numbered_list_item": {
        const text = richTextToMarkdown(block.numbered_list_item?.rich_text || []);
        lines.push(`${numberedListIndex}. ${text}\n`);
        break;
      }

      case "to_do": {
        const text = richTextToMarkdown(block.to_do?.rich_text || []);
        const checkbox = block.to_do?.checked ? "[x]" : "[ ]";
        lines.push(`- ${checkbox} ${text}\n`);
        break;
      }

      case "divider": {
        lines.push("---\n");
        break;
      }

      case "quote": {
        const text = richTextToMarkdown(block.quote?.rich_text || []);
        lines.push(`> ${text}\n`);
        break;
      }

      case "code": {
        const text = richTextToMarkdown(block.code?.rich_text || []);
        const language = block.code?.language || "";
        lines.push(`\`\`\`${language}\n${text}\n\`\`\`\n`);
        break;
      }

      case "callout": {
        const text = richTextToMarkdown(block.callout?.rich_text || []);
        const emoji = block.callout?.icon?.emoji || "";
        // Render callout as blockquote with emoji prefix
        lines.push(`> ${emoji} ${text}\n`);
        break;
      }

      default:
        // Unsupported block type - skip
        break;
    }
  }

  return lines.join("\n");
}
