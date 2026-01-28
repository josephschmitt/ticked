import { View } from "react-native";
import { Circle, CheckCircle2 } from "lucide-react-native";
import { RichText } from "./RichText";
import type { BlockProps } from "./types";
import { IOS_GRAYS, BRAND_COLORS } from "@/constants/colors";

export function ToDoBlock({ block, context }: BlockProps) {
  const { isDark, depth, renderChildren } = context;
  const textColor = isDark ? "#FFFFFF" : "#000000";
  const secondaryColor = isDark ? IOS_GRAYS.gray2 : IOS_GRAYS.system;
  const isChecked = block.to_do?.checked ?? false;
  const children = block.children;

  return (
    <>
      <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 4, paddingLeft: 8 + depth * 24 }}>
        <View style={{ marginTop: 2, marginRight: 8 }}>
          {isChecked ? (
            <CheckCircle2 size={20} color={BRAND_COLORS.primary} strokeWidth={2} />
          ) : (
            <Circle size={20} color={secondaryColor} strokeWidth={1.5} />
          )}
        </View>
        <View style={{ flex: 1 }}>
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
      {children && renderChildren && renderChildren(children)}
    </>
  );
}
