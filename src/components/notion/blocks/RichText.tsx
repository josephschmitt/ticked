import { Text, Linking, useColorScheme } from "react-native";
import type { RichTextItem } from "@/services/notion/operations/getPageContent";

interface RichTextProps {
  richText: RichTextItem[];
  style?: object;
}

/**
 * Maps Notion color names to actual color values.
 */
const NOTION_COLORS: Record<string, { light: string; dark: string }> = {
  default: { light: "#000000", dark: "#FFFFFF" },
  gray: { light: "#787774", dark: "#9B9A97" },
  brown: { light: "#64473A", dark: "#BA856F" },
  orange: { light: "#D9730D", dark: "#FFA344" },
  yellow: { light: "#CB912F", dark: "#FFDC49" },
  green: { light: "#448361", dark: "#4DAB9A" },
  blue: { light: "#337EA9", dark: "#529CCA" },
  purple: { light: "#9065B0", dark: "#9A6DD7" },
  pink: { light: "#C14C8A", dark: "#E255A1" },
  red: { light: "#D44C47", dark: "#FF7369" },
  gray_background: { light: "#F1F1EF", dark: "#454B4E" },
  brown_background: { light: "#F4EEEE", dark: "#4C3D36" },
  orange_background: { light: "#FBECDD", dark: "#5C3B23" },
  yellow_background: { light: "#FBF3DB", dark: "#574430" },
  green_background: { light: "#EDF3EC", dark: "#2E4A3E" },
  blue_background: { light: "#E7F3F8", dark: "#264A5C" },
  purple_background: { light: "#F4F0F7", dark: "#443259" },
  pink_background: { light: "#F9F0F5", dark: "#4E2E41" },
  red_background: { light: "#FDEBEC", dark: "#522E2A" },
};

/**
 * Get the color value for a Notion color name.
 */
function getNotionColor(colorName: string, isDark: boolean): string | undefined {
  const color = NOTION_COLORS[colorName];
  if (!color) return undefined;
  return isDark ? color.dark : color.light;
}

/**
 * Renders rich text with annotations (bold, italic, code, links, etc.)
 */
export function RichText({ richText, style }: RichTextProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const handleLinkPress = (url: string) => {
    Linking.openURL(url).catch((err) => {
      console.error("Failed to open URL:", err);
    });
  };

  return (
    <Text style={style}>
      {richText.map((item, index) => {
        const { annotations, plain_text, href } = item;

        let textStyle: object = {};
        let backgroundStyle: object = {};

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
          textStyle = {
            ...textStyle,
            textDecorationLine: annotations.strikethrough
              ? ("underline line-through" as const)
              : ("underline" as const),
          };
        }
        if (annotations.code) {
          textStyle = {
            ...textStyle,
            fontFamily: "Menlo",
            fontSize: 14,
          };
          backgroundStyle = {
            backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
            paddingHorizontal: 4,
            borderRadius: 4,
          };
        }

        // Handle Notion colors
        if (annotations.color && annotations.color !== "default") {
          const isBackground = annotations.color.endsWith("_background");
          if (isBackground) {
            const bgColor = getNotionColor(annotations.color, isDark);
            if (bgColor) {
              backgroundStyle = { ...backgroundStyle, backgroundColor: bgColor };
            }
          } else {
            const textColor = getNotionColor(annotations.color, isDark);
            if (textColor) {
              textStyle = { ...textStyle, color: textColor };
            }
          }
        }

        // Handle links
        if (href) {
          textStyle = {
            ...textStyle,
            color: isDark ? "#529CCA" : "#337EA9",
            textDecorationLine: "underline" as const,
          };

          return (
            <Text
              key={index}
              style={[textStyle, backgroundStyle]}
              onPress={() => handleLinkPress(href)}
            >
              {plain_text}
            </Text>
          );
        }

        return (
          <Text key={index} style={[textStyle, backgroundStyle]}>
            {plain_text}
          </Text>
        );
      })}
    </Text>
  );
}
