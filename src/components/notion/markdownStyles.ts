import { TextStyle, ViewStyle } from "react-native";
import { BRAND_COLORS, IOS_GRAYS } from "@/constants/colors";

type MarkdownStyleSheet = {
  [key: string]: TextStyle | ViewStyle;
};

export function getMarkdownStyles(isDark: boolean): MarkdownStyleSheet {
  // Use 80% opacity for slightly lighter text
  const textColor = isDark ? "rgba(235,235,245,0.8)" : "rgba(60,60,67,0.8)";
  const secondaryColor = isDark ? IOS_GRAYS.gray2 : IOS_GRAYS.system;
  const bgCodeInline = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)";
  const bgCodeBlock = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)";

  return {
    body: {
      color: textColor,
      fontSize: 17,
      lineHeight: 24,
    },
    text: {
      color: textColor,
    },
    heading1: {
      fontSize: 28,
      fontWeight: "700",
      color: textColor,
      marginTop: 16,
      marginBottom: 12,
    },
    heading2: {
      fontSize: 22,
      fontWeight: "600",
      color: textColor,
      marginTop: 12,
      marginBottom: 12,
    },
    heading3: {
      fontSize: 18,
      fontWeight: "600",
      color: textColor,
      marginTop: 8,
      marginBottom: 8,
    },
    paragraph: {
      fontSize: 17,
      lineHeight: 24,
      color: textColor,
      marginBottom: 12,
    },
    bullet_list: {
      marginBottom: 4,
    },
    ordered_list: {
      marginBottom: 4,
    },
    list_item: {
      flexDirection: "row",
      marginBottom: 4,
      paddingLeft: 8,
    },
    bullet_list_icon: {
      fontSize: 17,
      color: secondaryColor,
      marginRight: 8,
      lineHeight: 24,
    },
    ordered_list_icon: {
      fontSize: 17,
      color: secondaryColor,
      marginRight: 8,
      minWidth: 20,
      lineHeight: 24,
    },
    blockquote: {
      borderLeftWidth: 3,
      borderLeftColor: BRAND_COLORS.primary,
      paddingLeft: 16,
      paddingVertical: 4,
      marginBottom: 12,
    },
    code_inline: {
      fontFamily: "Menlo",
      fontSize: 14,
      backgroundColor: bgCodeInline,
      paddingHorizontal: 4,
      borderRadius: 4,
    },
    code_block: {
      fontFamily: "Menlo",
      fontSize: 14,
      lineHeight: 20,
      color: textColor,
    },
    fence: {
      backgroundColor: bgCodeBlock,
      padding: 12,
      borderRadius: 8,
      marginBottom: 12,
    },
    hr: {
      backgroundColor: isDark ? "rgba(84,84,88,0.6)" : "rgba(60,60,67,0.29)",
      height: 1,
      marginVertical: 16,
    },
    link: {
      color: BRAND_COLORS.primary,
      textDecorationLine: "underline",
    },
    strikethrough: {
      textDecorationLine: "line-through",
    },
    strong: {
      fontWeight: "600",
    },
    em: {
      fontStyle: "italic",
    },
    u: {
      textDecorationLine: "underline",
    },
  };
}
