import { View } from "react-native";
import { RichText } from "./RichText";
import type { BlockProps } from "./types";
import { BRAND_COLORS } from "@/constants/colors";

export function QuoteBlock({ block, context }: BlockProps) {
  const { isDark, depth } = context;
  const textColor = isDark ? "#FFFFFF" : "#000000";

  return (
    <View
      style={{
        marginBottom: 12,
        paddingLeft: 16,
        paddingVertical: 4,
        borderLeftWidth: 3,
        borderLeftColor: BRAND_COLORS.primary,
        marginLeft: depth * 24,
      }}
    >
      <RichText
        richText={block.quote?.rich_text || []}
        style={{ fontSize: 17, lineHeight: 24, color: textColor, fontStyle: "italic" }}
      />
    </View>
  );
}
