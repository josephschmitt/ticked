import { View, Text } from "react-native";
import { RichText } from "./RichText";
import type { BlockProps } from "./types";
import { IOS_GRAYS } from "@/constants/colors";

export function CodeBlock({ block, context }: BlockProps) {
  const { isDark, depth } = context;
  const textColor = isDark ? "#FFFFFF" : "#000000";
  const secondaryColor = isDark ? IOS_GRAYS.gray2 : IOS_GRAYS.system;
  const bgColor = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)";

  return (
    <View
      style={{
        marginBottom: 12,
        padding: 12,
        borderRadius: 8,
        backgroundColor: bgColor,
        marginLeft: depth * 24,
      }}
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
        <Text style={{ marginTop: 8, fontSize: 12, color: secondaryColor }}>
          {block.code.language}
        </Text>
      )}
    </View>
  );
}
