import { View } from "react-native";
import { RichText } from "./RichText";
import type { BlockProps } from "./types";

const HEADING_STYLES = {
  heading_1: { fontSize: 28, fontWeight: "700" as const, marginTop: 16, marginBottom: 12 },
  heading_2: { fontSize: 22, fontWeight: "600" as const, marginTop: 12, marginBottom: 12 },
  heading_3: { fontSize: 18, fontWeight: "600" as const, marginTop: 8, marginBottom: 8 },
};

export function HeadingBlock({ block, context }: BlockProps) {
  const { isDark, depth } = context;
  const textColor = isDark ? "#FFFFFF" : "#000000";

  const type = block.type as keyof typeof HEADING_STYLES;
  const styles = HEADING_STYLES[type];
  const richText =
    block.heading_1?.rich_text ||
    block.heading_2?.rich_text ||
    block.heading_3?.rich_text ||
    [];

  return (
    <View style={{ marginTop: styles.marginTop, marginBottom: styles.marginBottom, marginLeft: depth * 24 }}>
      <RichText
        richText={richText}
        style={{ fontSize: styles.fontSize, fontWeight: styles.fontWeight, color: textColor }}
      />
    </View>
  );
}
