import { View, Text } from "react-native";
import type { BlockProps } from "./types";
import { IOS_GRAYS } from "@/constants/colors";

export function UnsupportedBlock({ block, context }: BlockProps) {
  const { isDark, depth } = context;
  const textColor = isDark ? IOS_GRAYS.gray2 : IOS_GRAYS.system;
  const bgColor = isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)";

  // In production, you might want to return null instead
  // For development, showing the block type helps identify what needs implementation
  if (__DEV__) {
    return (
      <View
        style={{
          marginBottom: 8,
          padding: 8,
          borderRadius: 4,
          backgroundColor: bgColor,
          marginLeft: depth * 24,
        }}
      >
        <Text style={{ fontSize: 12, color: textColor, fontStyle: "italic" }}>
          Unsupported block: {block.type}
        </Text>
      </View>
    );
  }

  return null;
}
