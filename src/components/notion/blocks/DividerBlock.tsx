import { View } from "react-native";
import type { BlockProps } from "./types";
import { IOS_SEPARATORS } from "@/constants/colors";

export function DividerBlock({ block, context }: BlockProps) {
  const { isDark, depth } = context;
  const separatorColor = isDark ? IOS_SEPARATORS.default.dark : IOS_SEPARATORS.default.light;

  return (
    <View
      style={{
        height: 1,
        backgroundColor: separatorColor,
        marginVertical: 16,
        marginLeft: depth * 24,
      }}
    />
  );
}
