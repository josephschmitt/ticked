import { View } from "react-native";
import { RichText } from "./RichText";
import type { BlockProps } from "./types";
import { IOS_GRAYS } from "@/constants/colors";

export function ParagraphBlock({ block, context }: BlockProps) {
  const { isDark, depth } = context;
  const textColor = isDark ? "#FFFFFF" : "#000000";

  if (!block.paragraph?.rich_text.length) {
    // Empty paragraph - add some spacing
    return <View style={{ height: 16, marginLeft: depth * 24 }} />;
  }

  return (
    <View style={{ marginBottom: 12, marginLeft: depth * 24 }}>
      <RichText
        richText={block.paragraph.rich_text}
        style={{ fontSize: 17, lineHeight: 24, color: textColor }}
      />
    </View>
  );
}
