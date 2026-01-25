import { useColorScheme, Text } from "react-native";
import Markdown, { RenderRules } from "react-native-markdown-display";
import type { NotionBlock } from "@/services/notion/operations/getPageContent";
import { blocksToMarkdown } from "@/services/notion/markdown";
import { getMarkdownStyles } from "./markdownStyles";

interface MarkdownContentProps {
  blocks: NotionBlock[];
}

/**
 * Custom render rules for handling HTML tags like <u> for underline
 */
const customRules: RenderRules = {
  // Handle HTML underline tags
  htmlInline: (node, children, parent, styles) => {
    // Check if this is a <u> tag
    const content = node.content;
    if (content && typeof content === "string") {
      const underlineMatch = content.match(/<u>(.*?)<\/u>/);
      if (underlineMatch) {
        return (
          <Text key={node.key} style={{ textDecorationLine: "underline" }}>
            {underlineMatch[1]}
          </Text>
        );
      }
    }
    return null;
  },
};

/**
 * Renders Notion blocks as markdown content.
 * Converts blocks to markdown format, then renders with styled markdown display.
 */
export function MarkdownContent({ blocks }: MarkdownContentProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const styles = getMarkdownStyles(isDark);
  const markdown = blocksToMarkdown(blocks);

  return (
    <Markdown style={styles} rules={customRules}>
      {markdown}
    </Markdown>
  );
}
