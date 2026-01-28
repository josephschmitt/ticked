import { View, Text } from "react-native";
import { RichText } from "./RichText";
import type { BlockProps } from "./types";

export function CalloutBlock({ block, context }: BlockProps) {
  const { isDark, depth } = context;
  const textColor = isDark ? "#FFFFFF" : "#000000";
  const bgColor = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)";

  return (
    <View
      style={{
        marginBottom: 12,
        padding: 12,
        borderRadius: 8,
        backgroundColor: bgColor,
        flexDirection: "row",
        marginLeft: depth * 24,
      }}
    >
      {block.callout?.icon?.emoji && (
        <Text style={{ marginRight: 8, fontSize: 20 }}>
          {block.callout.icon.emoji}
        </Text>
      )}
      <View style={{ flex: 1 }}>
        <RichText
          richText={block.callout?.rich_text || []}
          style={{ fontSize: 17, lineHeight: 24, color: textColor }}
        />
      </View>
    </View>
  );
}
