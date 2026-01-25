import { View, Text, useColorScheme } from "react-native";
import { Circle, CheckCircle2 } from "lucide-react-native";
import type { NotionBlock, RichTextItem } from "@/services/notion/operations/getPageContent";
import { IOS_GRAYS, BRAND_COLORS, IOS_SEPARATORS } from "@/constants/colors";

interface RichTextProps {
  richText: RichTextItem[];
  style?: object;
}

/**
 * Renders rich text with annotations (bold, italic, code, etc.)
 */
function RichText({ richText, style }: RichTextProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Text style={style}>
      {richText.map((item, index) => {
        const { annotations, plain_text } = item;

        let textStyle: object = {};

        if (annotations.bold) {
          textStyle = { ...textStyle, fontWeight: "600" as const };
        }
        if (annotations.italic) {
          textStyle = { ...textStyle, fontStyle: "italic" as const };
        }
        if (annotations.strikethrough) {
          textStyle = { ...textStyle, textDecorationLine: "line-through" as const };
        }
        if (annotations.underline) {
          textStyle = { ...textStyle, textDecorationLine: "underline" as const };
        }
        if (annotations.code) {
          textStyle = {
            ...textStyle,
            fontFamily: "Menlo",
            fontSize: 14,
            backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
            paddingHorizontal: 4,
            borderRadius: 4,
          };
        }

        return (
          <Text key={index} style={textStyle}>
            {plain_text}
          </Text>
        );
      })}
    </Text>
  );
}

interface BlockRendererProps {
  block: NotionBlock;
  index?: number;
}

/**
 * Renders a single Notion block as a React Native component.
 */
export function BlockRenderer({ block, index = 0 }: BlockRendererProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const textColor = isDark ? "#FFFFFF" : "#000000";
  const secondaryColor = isDark ? IOS_GRAYS.gray2 : IOS_GRAYS.system;
  const separatorColor = isDark ? IOS_SEPARATORS.default.dark : IOS_SEPARATORS.default.light;

  switch (block.type) {
    case "paragraph":
      if (!block.paragraph?.rich_text.length) {
        // Empty paragraph - add some spacing
        return <View className="h-4" />;
      }
      return (
        <View className="mb-3">
          <RichText
            richText={block.paragraph.rich_text}
            style={{ fontSize: 17, lineHeight: 24, color: textColor }}
          />
        </View>
      );

    case "heading_1":
      return (
        <View className="mb-3 mt-4">
          <RichText
            richText={block.heading_1?.rich_text || []}
            style={{ fontSize: 28, fontWeight: "700", color: textColor }}
          />
        </View>
      );

    case "heading_2":
      return (
        <View className="mb-3 mt-3">
          <RichText
            richText={block.heading_2?.rich_text || []}
            style={{ fontSize: 22, fontWeight: "600", color: textColor }}
          />
        </View>
      );

    case "heading_3":
      return (
        <View className="mb-2 mt-2">
          <RichText
            richText={block.heading_3?.rich_text || []}
            style={{ fontSize: 18, fontWeight: "600", color: textColor }}
          />
        </View>
      );

    case "bulleted_list_item":
      return (
        <View className="flex-row mb-1 pl-2">
          <Text style={{ fontSize: 17, color: secondaryColor, marginRight: 8 }}>•</Text>
          <View className="flex-1">
            <RichText
              richText={block.bulleted_list_item?.rich_text || []}
              style={{ fontSize: 17, lineHeight: 24, color: textColor }}
            />
          </View>
        </View>
      );

    case "numbered_list_item":
      return (
        <View className="flex-row mb-1 pl-2">
          <Text style={{ fontSize: 17, color: secondaryColor, marginRight: 8, minWidth: 20 }}>
            {(index + 1)}.
          </Text>
          <View className="flex-1">
            <RichText
              richText={block.numbered_list_item?.rich_text || []}
              style={{ fontSize: 17, lineHeight: 24, color: textColor }}
            />
          </View>
        </View>
      );

    case "to_do":
      const isChecked = block.to_do?.checked ?? false;
      return (
        <View className="flex-row items-start mb-1 pl-2">
          <View className="mt-0.5 mr-2">
            {isChecked ? (
              <CheckCircle2 size={20} color={BRAND_COLORS.primary} strokeWidth={2} />
            ) : (
              <Circle size={20} color={secondaryColor} strokeWidth={1.5} />
            )}
          </View>
          <View className="flex-1">
            <RichText
              richText={block.to_do?.rich_text || []}
              style={{
                fontSize: 17,
                lineHeight: 24,
                color: isChecked ? secondaryColor : textColor,
                textDecorationLine: isChecked ? "line-through" : "none",
              }}
            />
          </View>
        </View>
      );

    case "divider":
      return (
        <View
          className="my-4"
          style={{ height: 1, backgroundColor: separatorColor }}
        />
      );

    case "quote":
      return (
        <View
          className="mb-3 pl-4 py-1"
          style={{ borderLeftWidth: 3, borderLeftColor: BRAND_COLORS.primary }}
        >
          <RichText
            richText={block.quote?.rich_text || []}
            style={{ fontSize: 17, lineHeight: 24, color: textColor, fontStyle: "italic" }}
          />
        </View>
      );

    case "code":
      return (
        <View
          className="mb-3 p-3 rounded-lg"
          style={{ backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)" }}
        >
          <RichText
            richText={block.code?.rich_text || []}
            style={{
              fontFamily: "Menlo",
              fontSize: 14,
              lineHeight: 20,
              color: textColor,
            }}
          />
          {block.code?.language && (
            <Text
              className="mt-2"
              style={{ fontSize: 12, color: secondaryColor }}
            >
              {block.code.language}
            </Text>
          )}
        </View>
      );

    case "callout":
      return (
        <View
          className="mb-3 p-3 rounded-lg flex-row"
          style={{ backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)" }}
        >
          {block.callout?.icon?.emoji && (
            <Text className="mr-2" style={{ fontSize: 20 }}>
              {block.callout.icon.emoji}
            </Text>
          )}
          <View className="flex-1">
            <RichText
              richText={block.callout?.rich_text || []}
              style={{ fontSize: 17, lineHeight: 24, color: textColor }}
            />
          </View>
        </View>
      );

    default:
      // Unsupported block type - render nothing
      return null;
  }
}

interface BlockListRendererProps {
  blocks: NotionBlock[];
}

/**
 * Renders a list of Notion blocks, tracking numbered list indices.
 */
export function BlockListRenderer({ blocks }: BlockListRendererProps) {
  let numberedListIndex = 0;

  return (
    <>
      {blocks.map((block, i) => {
        // Track numbered list position
        if (block.type === "numbered_list_item") {
          numberedListIndex++;
        } else {
          numberedListIndex = 0;
        }

        return (
          <BlockRenderer
            key={block.id}
            block={block}
            index={block.type === "numbered_list_item" ? numberedListIndex - 1 : i}
          />
        );
      })}
    </>
  );
}
